import { rateLimit } from 'express-rate-limit';

/**
 * Create one limiter per application instance and reuse it for the login route.
 * Mount after request-origin protection but before password verification, so
 * repeated login attempts cannot trigger unlimited expensive scrypt operations.
 *
 * Count every attempt, including successful logins: this keeps the resource
 * limit predictable and avoids refunding requests while others are in flight.
 * Users behind the same public IP share this allowance. The package's default
 * key generator also groups IPv6 addresses to reduce address-rotation bypasses.
 *
 * The default memory store is appropriate for our single backend process.
 * Counters reset on restart and are not shared between processes. Deployment
 * with multiple instances requires a shared store before relying on this limit.
 * Keep Express proxy trust disabled until the actual proxy topology is known;
 * blindly trusting forwarded headers can allow attackers to spoof client IPs.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
 */
export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,

    // Publish the standardized quota/reset headers. The middleware also sends
    // Retry-After when blocked, so clients know when they may try again.
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,

    // If a future external store fails, reject rather than silently disabling
    // protection. Express error handling must return a safe response.
    passOnStoreError: false,
    statusCode: 429,
    message: {
      error: 'Too many login attempts. Please try again later.',
    },
  });
}
