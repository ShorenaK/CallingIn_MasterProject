import express from 'express';
import { register } from './registration.js';

/** @param {import('mongodb').Db} [db] */
export function createApp(db) {
  const app = express();
  app.locals.db = db;
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.post('/api/auth/register', register);

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
