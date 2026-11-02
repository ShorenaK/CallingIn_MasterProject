import { rateLimit } from 'express-rate-limit';

/**
 * Mount after requireAccount: keys must come only from verified account IDs.
 * Counts all attempts. Memory counters reset on restart and are not shared
 * between processes; multiple instances require a shared store.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
export function createLookupRateLimiter() {
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
    message: { error: 'Too many recipient lookups. Please try again later.' },
  });
}
