/**
 * Read one explicit browser origin. Reject paths, credentials, wildcards, and
 * noncanonical spellings rather than silently broadening the trusted value.
 * This validation happens during setup so a bad setting prevents startup.
 * @param {Record<string, string | undefined>} env
 */
function trustedOrigin(env) {
  const configured = env.APP_ORIGIN;
  let origin;
  try {
    origin = new URL(configured ?? '');
  } catch {
    throw new Error(
      'APP_ORIGIN must be an exact HTTP or HTTPS browser origin.',
    );
  }
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.origin !== configured ||
    origin.username ||
    origin.password
  ) {
    throw new Error(
      'APP_ORIGIN must be an exact HTTP or HTTPS browser origin.',
    );
  }
  if (env.NODE_ENV === 'production' && origin.protocol !== 'https:') {
    throw new Error('APP_ORIGIN must use HTTPS in production.');
  }
  return origin.origin;
}

/**
 * Protect a JSON-only browser API against cross-site request forgery (CSRF).
 * Browsers control the Origin header; frontend JavaScript cannot freely forge
 * it. Exact origin matching plus application/json prevents cross-site forms
 * from issuing accepted writes with automatically attached session cookies.
 *
 * Mount before state-changing routes, including login and registration. Also
 * mount before the JSON body parser to reject untrusted writes before parsing.
 * This middleware does not enable CORS; permissive CORS must not be added.
 *
 * Safe methods pass through only because routes using them must never mutate
 * application state. Logout must therefore use POST, not GET. Requests without
 * Origin are deliberately rejected for writes, including command-line clients;
 * those clients must explicitly provide Origin and Content-Type headers.
 *
 * This is not authentication or rate limiting. Same-origin malicious scripts
 * (XSS) also require separate prevention; they can pass these checks.
 * @param {Record<string, string | undefined>} [env]
 * @returns {import('express').RequestHandler}
 */
export function createRequestProtection(env = process.env) {
  const allowedOrigin = trustedOrigin(env);
  return function protectRequest(request, response, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next();

    // Reject absent, opaque ("null"), or other origins. Do not fall back to a
    // caller-controlled Host or forwarded header to decide what is trusted.
    if (request.get('Origin') !== allowedOrigin) {
      return response
        .status(403)
        .json({ error: 'Request origin is not allowed.' });
    }

    // Match the media type exactly while permitting parameters such as charset.
    // Form encodings and text/plain are intentionally unsupported, even when
    // their bodies happen to contain text that looks like JSON.
    const mediaType = request
      .get('Content-Type')
      ?.split(';')[0]
      .trim()
      .toLowerCase();
    if (mediaType !== 'application/json') {
      return response
        .status(415)
        .json({ error: 'Content-Type must be application/json.' });
    }
    return next();
  };
}
