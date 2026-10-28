import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createRegistrationRateLimiter } from '../src/registration-rate-limit.js';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

test('registration counts successes and blocks before downstream account work', async (t) => {
  const app = express();
  let calls = 0;
  app.post(
    '/register',
    createRegistrationRateLimiter(),
    (_request, response) => {
      calls += 1;
      response.status(201).json({ ok: true });
    },
  );
  const url = await startTestServer(t, app);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(
      (await fetch(`${url}/register`, { method: 'POST' })).status,
      201,
    );
  }
  const blocked = await fetch(`${url}/register`, { method: 'POST' });
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    error: 'Too many registration attempts. Please try again later.',
  });
  const retry = Number(blocked.headers.get('retry-after'));
  assert.ok(retry > 0 && retry <= 900);
  assert.ok(blocked.headers.get('ratelimit'));
  assert.ok(blocked.headers.get('ratelimit-policy'));
  assert.equal(blocked.headers.get('x-ratelimit-limit'), null);
  assert.equal(calls, 5);
});

test('full app limits failed registrations after origin protection and independently of login', async (t) => {
  const origin = 'http://127.0.0.1:5173';
  const app = createApp(undefined, {
    requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
    sessionMiddleware: (_request, _response, next) => next(),
  });
  const url = await startTestServer(t, app);
  const attempt = (path, requestOrigin = origin) =>
    fetch(`${url}/api/auth/${path}`, {
      method: 'POST',
      headers: { Origin: requestOrigin, 'Content-Type': 'application/json' },
      body: '{}',
    });
  for (let count = 0; count < 6; count += 1) {
    assert.equal(
      (await attempt('register', 'http://untrusted.example')).status,
      403,
    );
  }
  for (let count = 0; count < 5; count += 1) {
    assert.equal((await attempt('register')).status, 400);
  }
  assert.equal((await attempt('register')).status, 429);
  assert.equal((await attempt('login')).status, 400);

  const independentUrl = await startTestServer(t, createApp());
  assert.equal(
    (
      await fetch(`${independentUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    ).status,
    400,
  );
});
