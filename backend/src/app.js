import express from 'express';
import { register } from './registration.js';
import { login, logout, currentUser, updateProfile } from './authentication.js';
import { createLoginRateLimiter } from './login-rate-limit.js';
import { createRegistrationRateLimiter } from './registration-rate-limit.js';
import { requireAccount } from './require-account.js';
import { lookupRecipient } from './recipient-lookup.js';
import { createLookupRateLimiter } from './lookup-rate-limit.js';

const accountRoutes = ['/api/users', '/api/invitations'];

/**
 * Startup prepares database-backed sessions before handing middleware to this
 * synchronous app factory. Tests can supply controlled middleware without Atlas.
 * Both protections are required together; partial configuration is an error.
 * Omitting both preserves the existing registration/health-only application
 * for isolated use. Production startup supplies both.
 * @param {import('mongodb').Db} [db]
 * @param {{sessionMiddleware: import('express').RequestHandler, requestProtection: import('express').RequestHandler}} [authentication]
 */
export function createApp(db, authentication) {
  if (
    authentication &&
    (typeof authentication.sessionMiddleware !== 'function' ||
      typeof authentication.requestProtection !== 'function')
  ) {
    throw new Error(
      'Authentication requires session and request protection middleware.',
    );
  }
  const app = express();
  app.locals.db = db;

  // Reject untrusted API writes before reading their JSON bodies or
  // accessing session storage. No CORS or proxy trust is enabled here.
  if (authentication)
    app.use(['/api/auth', ...accountRoutes], authentication.requestProtection);
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.post('/api/auth/register', createRegistrationRateLimiter(), register);

  if (authentication) {
    // Limit login attempts before session/database work and password hashing.
    // One limiter is shared by all login requests to this application instance.
    app.use('/api/auth/login', createLoginRateLimiter());
    app.use('/api/auth', authentication.sessionMiddleware);
    app.post('/api/auth/login', login);
    app.post('/api/auth/logout', logout);
    app.get('/api/auth/me', currentUser);
    app.patch('/api/auth/me', updateProfile);
    app.use(accountRoutes, authentication.sessionMiddleware, requireAccount);
    app.post('/api/users/lookup', createLookupRateLimiter(), lookupRecipient);
  }

  app.use(handleError);
  return app;
}

/** @type {import('express').ErrorRequestHandler} */
export function handleError(error, _request, response, next) {
  if (response.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large.' });
  }
  if (error.type === 'entity.parse.failed') {
    return response
      .status(400)
      .json({ error: 'Request body must be valid JSON.' });
  }
  return response.status(500).json({ error: 'An unexpected error occurred.' });
}

export default createApp();
