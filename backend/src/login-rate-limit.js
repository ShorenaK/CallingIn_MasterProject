import { rateLimit } from 'express-rate-limit';
import { validEmail } from './account-policy.js';

const sharedOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: /** @type {const} */ ('draft-8'),
  legacyHeaders: false,
  passOnStoreError: false,
  statusCode: 429,
};

/**
 * Mount both checks before session/database work and password verification.
 * The IP ceiling bounds total work, including successes and invalid input.
 * The email allowance counts credential failures (401) across all client IPs;
 * unknown accounts follow the same rules as existing ones. Other completed
 * responses are refunded, so invalid input and service errors do not lock an email.
 * In-flight requests reserve a slot until completion; simultaneous requests can
 * temporarily reach the limit even if some later succeed. Aborted requests may
 * retain a reservation until expiry. A success does not erase earlier failures.
 *
 * Each app has independent memory stores. Restart resets counters; multiple
 * backend processes require a shared store. Keep proxy trust disabled until
 * deployment topology is known. The default IP key groups IPv6 subnets.
 * @returns {import('express-rate-limit').RateLimitRequestHandler[]}
 */
export function createLoginRateLimiter() {
  const ipLimiter = rateLimit({
    ...sharedOptions,
    identifier: 'login-ip',
    requestPropertyName: 'loginIpRateLimit',
    limit: 100,
    message: {
      error:
        'Too many login attempts from this connection. Please try again later.',
    },
  });
  const emailLimiter = rateLimit({
    ...sharedOptions,
    identifier: 'login-email',
    requestPropertyName: 'loginEmailRateLimit',
    limit: 10,
    skip: (request) => !validEmail(request.body?.email),
    keyGenerator: (request) => request.body.email.trim().toLowerCase(),
    skipSuccessfulRequests: true,
    requestWasSuccessful: (_request, response) => response.statusCode !== 401,
    message: {
      error:
        'Too many failed login attempts for this email. Please try again later.',
    },
  });
  return [ipLimiter, emailLimiter];
}
