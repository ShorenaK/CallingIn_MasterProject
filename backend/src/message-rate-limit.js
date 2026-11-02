import { rateLimit } from 'express-rate-limit';

/**
 * Mount after requireAccount. The sending allowance is shared across conversations.
 * All attempts count. Memory counters reset on restart; multiple backend
 * processes require a shared store before relying on this protection.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
export function createMessageRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    keyGenerator: (_request, response) =>
      response.locals.accountId.toHexString(),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    passOnStoreError: false,
    statusCode: 429,
    message: { error: 'Too many message attempts. Please try again later.' },
  });
}
