import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { validCoachInput, validCoachText } from './ai-coach-policy.js';
import { CoachFailure, requestSuggestion } from './ai-coach-provider.js';
import { logAccountFailure } from './safe-logging.js';

/** Development protection, not a durable daily spending quota.
 * @param {import('./ai-coach-provider.js').CoachOptions} [options]
 */
export function createCoachRouter(options = {}) {
  const timeoutMs = options.timeoutMs ?? 20_000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20_000)
    throw new Error('Coach timeout must be between 1 and 20000 milliseconds.');
  const router = Router();
  router.post(
    '/suggestions',
    rateLimit({
      windowMs: 60_000,
      limit: 5,
      keyGenerator: (_request, response) =>
        response.locals.accountId.toHexString(),
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      passOnStoreError: false,
      message: { error: 'Too many Coach attempts. Please try again later.' },
    }),
    createSuggestionHandler({ ...options, timeoutMs }),
  );
  return router;
}

/** @param {import('./ai-coach-provider.js').CoachOptions & {timeoutMs: number}} options */
function createSuggestionHandler({ generate, timeoutMs }) {
  const pending = new Set();
  /** @type {import('express').RequestHandler} */
  return async function suggest(request, response) {
    response.set('Cache-Control', 'no-store');
    if (!validCoachInput(request.body)) {
      response.status(400).json({
        error:
          'Provide only action (draft/refine), tone (natural/warm/direct), and text of 1–5000 characters with visible content.',
      });
      return;
    }
    if (!generate) {
      response.status(503).json({
        error:
          'AI Coach is currently unavailable. You can still write your invitation.',
      });
      return;
    }
    const account = response.locals.accountId.toHexString();
    if (pending.has(account)) {
      response
        .set('Retry-After', '1')
        .status(429)
        .json({ error: 'A Coach request is already in progress.' });
      return;
    }
    pending.add(account);
    try {
      const input = { ...request.body, text: request.body.text.trim() };
      const text = await requestSuggestion(
        generate,
        input,
        response,
        timeoutMs,
      );
      if (!validCoachText(text)) {
        response.status(502).json({
          error: 'AI Coach returned an invalid suggestion. Please try again.',
        });
        return;
      }
      if (!response.destroyed) response.json({ suggestion: text.trim() });
    } catch (failure) {
      handleCoachFailure(request, response, failure);
    } finally {
      pending.delete(account);
    }
  };
}

/** @param {import('express').Request} request
 * @param {import('express').Response} response
 * @param {unknown} failure
 */
function handleCoachFailure(request, response, failure) {
  if (response.destroyed) return;
  if (failure instanceof CoachFailure) {
    const status = {
      refused: 422,
      unavailable: 503,
      timeout: 504,
      cancelled: 503,
    }[failure.kind];
    response.status(status).json({
      error:
        'AI Coach could not complete this request. Your invitation has not been sent.',
    });
    return;
  }
  // Do not inspect or serialize provider errors, which may contain user text or keys.
  logAccountFailure(request, 'ai-coach', undefined);
  response.status(503).json({
    error: 'AI Coach is temporarily unavailable. Please try again later.',
  });
}
