/** @typedef {{id: string, displayName: string, email: string}} User */

export class ApiError extends Error {
  /** @param {string} message @param {number} status @param {number | null} [retryAfter]
   * @param {string} [code] Allowlisted application error code, not a driver error.
   */
  constructor(message, status, retryAfter = null, code = '') {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
    this.code = code;
  }
}

/**
 * Cookies stay in the browser's HttpOnly cookie jar. Never persist credentials
 * or account data in localStorage. The server remains the authorization boundary.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<{user: User} | undefined>}
 */
export async function accountRequest(path, options = {}) {
  const data = await apiRequest(`/api/auth/${path}`, options);
  if (data === undefined) return undefined;
  validateUser(data);
  return { user: /** @type {{user: User}} */ (data).user };
}

/**
 * Shared JSON request for signed-in features. Server error messages are shown
 * as returned; the status lets callers recognize an expired session (401).
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>}
 */
export async function apiRequest(url, options = {}) {
  const response = await fetchJson(url, options);
  if (response.status === 204) return undefined;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      typeof data?.error === 'string'
        ? data.error
        : 'Something went wrong. Please try again.',
      response.status,
      retryDelay(response.headers.get('Retry-After')),
      typeof data?.code === 'string' &&
        ['INVITATION_COOLDOWN', 'INVITATION_ACTIVE'].includes(data.code)
        ? data.code
        : '',
    );
  }
  return data;
}

/** Accept only bounded delta-seconds; never display an arbitrary header value.
 * @param {string | null} value
 */
function retryDelay(value) {
  if (!value || !/^\d{1,5}$/.test(value)) return null;
  const seconds = Number(value);
  return seconds > 0 && seconds <= 86400 ? seconds : null;
}

/** @param {unknown} error */
export function errorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

/** @param {unknown} input */
function validateUser(input) {
  const data = /** @type {{user?: Partial<User>} | null} */ (input);
  if (
    !data?.user ||
    typeof data.user.id !== 'string' ||
    typeof data.user.displayName !== 'string' ||
    typeof data.user.email !== 'string'
  ) {
    throw new Error(
      'The server returned an unexpected response. Please try again.',
    );
  }
}

/** @param {string} url @param {RequestInit} options */
async function fetchJson(url, options) {
  try {
    return await fetch(url, {
      ...options,
      credentials: 'same-origin',
      signal: options.signal ?? AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error(
        'The request took too long. Check your account before trying again.',
        { cause: error },
      );
    }
    throw new Error(
      'Unable to connect. Please check your connection and try again.',
      { cause: error },
    );
  }
}
