import {
  readBattery,
  saveBattery,
  readPartnerBattery,
} from './social-battery.js';
import { requireConversation } from './conversation-access.js';
import { sendMessage, listMessages } from './messages.js';
import { createMessageRateLimiter } from './message-rate-limit.js';
import express from 'express';
import { createCoachRouter } from './ai-coach.js';
import { register } from './registration.js';
import { login, logout, currentUser, updateProfile } from './authentication.js';
import { createLoginRateLimiter } from './login-rate-limit.js';
import { createRegistrationRateLimiter } from './registration-rate-limit.js';
import { requireAccount } from './require-account.js';
import { lookupRecipient } from './recipient-lookup.js';
import { createLookupRateLimiter } from './lookup-rate-limit.js';
import { createInvitation } from './invitation-creation.js';
import { createInvitationRateLimiter } from './invitation-rate-limit.js';

import { listInvitations } from './invitation-listing.js';

import { openConversation } from './conversation-opening.js';

import { respondToInvitation } from './invitation-response.js';

const accountRoutes = [
  '/api/users',
  '/api/invitations',
  '/api/conversations',
  '/api/ai-coach',
];

/**
 * Startup prepares database-backed sessions before handing middleware to this
 * synchronous app factory. Tests can supply controlled middleware without Atlas.
 * Both protections are required together; partial configuration is an error.
 * Omitting both preserves the existing registration/health-only application
 * for isolated use. Production startup supplies both.
 * @param {import('mongodb').Db} [db]
 * @param {{sessionMiddleware: import('express').RequestHandler, requestProtection: import('express').RequestHandler}} [authentication]
 * @param {import('./ai-coach-provider.js').CoachOptions} [coach]
 */
export function createApp(db, authentication, coach) {
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
    // Separate shared-IP and failed-per-email allowances for POST login only.
    app.post('/api/auth/login', ...createLoginRateLimiter());
    app.use('/api/auth', authentication.sessionMiddleware);
    app.post('/api/auth/login', login);
    app.post('/api/auth/logout', logout);
    app.get('/api/auth/me', currentUser);
    app.patch('/api/auth/me', updateProfile);
    app.use(accountRoutes, authentication.sessionMiddleware, requireAccount);
    app.use('/api/ai-coach', createCoachRouter(coach));
    app.get('/api/users/me/social-battery', readBattery);
    app.patch('/api/users/me/social-battery', saveBattery);
    app.get(
      '/api/conversations/:id/social-battery',
      requireConversation,
      readPartnerBattery,
    );
    app.get(
      '/api/conversations/:id/messages',
      requireConversation,
      listMessages,
    );
    app.post(
      '/api/conversations/:id/messages',
      createMessageRateLimiter(),
      requireConversation,
      sendMessage,
    );
    app.get('/api/invitations', listInvitations);
    app.post('/api/invitations/:id/conversation', openConversation);
    app.patch('/api/invitations/:id/response', respondToInvitation);
    app.post('/api/users/lookup', createLookupRateLimiter(), lookupRecipient);
    app.post(
      '/api/invitations',
      createInvitationRateLimiter(),
      createInvitation,
    );
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
