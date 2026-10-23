import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createLoginRateLimiter } from '../src/login-rate-limit.js';
import { startTestServer } from '../test-support/server.js';

async function startLimitedApp(t) {
  const app = express();
  let handlerCalls = 0;
  // One limiter per application, matching the intended route wiring. The test
  // handler deliberately avoids hashing passwords or accessing account storage.
  app.post('/login', createLoginRateLimiter(), (_request, response) => {
    handlerCalls += 1;
    response.json({ ok: true });
  });
  const url = await startTestServer(t, app);
  return { url: `${url}/login`, handlerCalls: () => handlerCalls };
}

async function makeAttempt(url) {
  const response = await fetch(url, { method: 'POST' });
  const body = await response.json();
  return { response, body };
}

test('ten attempts pass; later attempts are blocked before the login handler', async (t) => {
  const app = await startLimitedApp(t);
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const { response, body } = await makeAttempt(app.url);
    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
  }

  // Successful attempts also count. Blocking must prevent expensive downstream
  // login work, rather than merely change the response after that work runs.
  for (let attempt = 11; attempt <= 12; attempt += 1) {
    const { response, body } = await makeAttempt(app.url);
    assert.equal(response.status, 429);
    assert.deepEqual(body, {
      error: 'Too many login attempts. Please try again later.',
    });
    const retrySeconds = Number(response.headers.get('retry-after'));
    assert.ok(retrySeconds > 0 && retrySeconds <= 15 * 60);
    assert.ok(response.headers.get('ratelimit'));
    assert.ok(response.headers.get('ratelimit-policy'));
    assert.equal(response.headers.get('x-ratelimit-limit'), null);
  }
  assert.equal(app.handlerCalls(), 10);
});

test('application instances have independent memory-store counters', async (t) => {
  const first = await startLimitedApp(t);
  const second = await startLimitedApp(t);
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    assert.equal((await makeAttempt(first.url)).response.status, 200);
  }
  assert.equal((await makeAttempt(first.url)).response.status, 429);

  // This isolation is useful in tests but also documents the deployment limit:
  // multiple production processes need a shared store to enforce one quota.
  assert.equal((await makeAttempt(second.url)).response.status, 200);
  assert.equal(first.handlerCalls(), 10);
  assert.equal(second.handlerCalls(), 1);
});
