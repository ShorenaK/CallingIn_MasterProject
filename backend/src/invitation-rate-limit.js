import { rateLimit } from 'express-rate-limit';

/**
 * Mount after requireAccount. This allowance is independent of recipient lookup.
 * All attempts count. Memory counters reset on restart; multiple backend
 * processes require a shared store before relying on this protection.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
export function createInvitationRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyGenerator: (_request, response) =>
      response.locals.accountId.toHexString(),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    passOnStoreError: false,
    statusCode: 429,
    message: { error: 'Too many invitation attempts. Please try again later.' },
  });
}
