import { rateLimit } from 'express-rate-limit';

/**
 * Bound expensive registration hashing before the handler runs. Every attempt
 * counts, including successes; clients sharing a public IP share this quota.
 * Like the login limiter, this uses process-local counters and leaves proxy
 * trust disabled. Multiple backend processes require a shared limiter store.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
export function createRegistrationRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    passOnStoreError: false,
    statusCode: 429,
    message: {
      error: 'Too many registration attempts. Please try again later.',
    },
  });
}
