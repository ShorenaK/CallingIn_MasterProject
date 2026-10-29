import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

const middleware = (_request, _response, next) => next();

test('app rejects partial or invalid authentication configuration', () => {
  for (const authentication of [
    {},
    { sessionMiddleware: middleware },
    { requestProtection: middleware },
    { sessionMiddleware: null, requestProtection: middleware },
    { sessionMiddleware: middleware, requestProtection: 'invalid' },
  ]) {
    assert.throws(() => createApp(undefined, authentication), {
      message:
        'Authentication requires session and request protection middleware.',
    });
  }
  assert.doesNotThrow(() =>
    createApp(undefined, {
      sessionMiddleware: middleware,
      requestProtection: middleware,
    }),
  );
  // Omitting authentication remains supported for isolated registration tests.
  assert.doesNotThrow(() => createApp());
});
