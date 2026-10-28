const errorNames = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'MongoServerError',
  'MongoNetworkError',
  'MongoServerSelectionError',
]);
const errorCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ERR_CRYPTO_INVALID_SCRYPT_PARAMS',
  11000,
]);

/**
 * Never serialize errors, messages, stacks, request data, or arbitrary name/code
 * fields: database errors can contain credentials and user input in any of them.
 * @param {import('express').Request} request
 * @param {'login' | 'login-cleanup' | 'logout' | 'current-user' | 'profile-update' | 'registration'} operation
 * @param {unknown} failure
 */
export function logAccountFailure(request, operation, failure) {
  const error = failure instanceof Error ? failure : undefined;
  const name =
    error && errorNames.has(error.name) ? error.name : 'UnknownError';
  const code = safeCode(error);
  try {
    const logger = request.app.locals.logger ?? console;
    logger.error('Account operation failed', { operation, name, code });
  } catch {
    // Logging failures must not prevent session cleanup or safe error responses.
  }
}

/** @param {Error | undefined} error */
function safeCode(error) {
  if (!error || !('code' in error)) return 'UNKNOWN';
  return errorCodes.has(/** @type {string | number} */ (error.code))
    ? error.code
    : 'UNKNOWN';
}
