import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createLoginRateLimiter } from '../src/login-rate-limit.js';
import { startTestServer } from '../test-support/server.js';

async function startLimitedApp(t, handler) {
  const app = express();
  let handlerCalls = 0;
  app.use(express.json());
  // Test-only IP substitution: exercise distinct clients without enabling proxy
  // trust or changing production request handling.
  app.use((request, _response, next) => {
    if (request.headers['x-test-ip']) {
      Object.defineProperty(request, 'ip', {
        value: request.headers['x-test-ip'],
      });
    }
    next();
  });
  const limiters = createLoginRateLimiter();
  app.post('/login', ...limiters, (request, response) => {
    handlerCalls += 1;
    if (handler) return handler(request, response);
    response.status(request.body.outcome ?? 401).json({ ok: true });
  });
  const url = await startTestServer(t, app);
  return { url: `${url}/login`, limiters, handlerCalls: () => handlerCalls };
}

async function makeAttempt(
  url,
  email = 'one@example.com',
  outcome = 401,
  headers = {},
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ email, outcome }),
  });
  const body = await response.json();
  return { response, body };
}

function assertBlocked(result, message) {
  assert.equal(result.response.status, 429);
  assert.equal(result.body.error, message);
  const seconds = Number(result.response.headers.get('retry-after'));
  assert.ok(seconds > 0 && seconds <= 900);
  assert.ok(result.response.headers.get('ratelimit'));
  assert.ok(result.response.headers.get('ratelimit-policy'));
  assert.equal(result.response.headers.get('x-ratelimit-limit'), null);
}

test('ten credential failures block normalized email, but not another email', async (t) => {
  const app = await startLimitedApp(t);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const email = attempt % 2 ? ' ONE@EXAMPLE.COM ' : 'one@example.com';
    assert.equal((await makeAttempt(app.url, email)).response.status, 401);
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    assertBlocked(
      await makeAttempt(app.url, 'One@Example.com', 200),
      'Too many failed login attempts for this email. Please try again later.',
    );
  }
  assert.equal(app.handlerCalls(), 10);
  assert.equal(
    (await makeAttempt(app.url, 'two@example.com', 200)).response.status,
    200,
  );
});

test('successes do not consume email quota or erase earlier failures', async (t) => {
  const app = await startLimitedApp(t);
  for (let attempt = 0; attempt < 9; attempt += 1) {
    assert.equal((await makeAttempt(app.url)).response.status, 401);
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    assert.equal(
      (await makeAttempt(app.url, 'one@example.com', 200)).response.status,
      200,
    );
  }
  assert.equal((await makeAttempt(app.url)).response.status, 401);
  assert.equal((await makeAttempt(app.url)).response.status, 429);
});

test('invalid inputs and service errors do not consume email failure allowance', async (t) => {
  const app = await startLimitedApp(t);
  for (const outcome of [400, 503]) {
    for (let attempt = 0; attempt < 11; attempt += 1) {
      assert.equal(
        (await makeAttempt(app.url, 'one@example.com', outcome)).response
          .status,
        outcome,
      );
    }
  }
  for (const email of [null, {}, ['one@example.com'], '', 'invalid']) {
    assert.equal((await makeAttempt(app.url, email, 400)).response.status, 400);
  }
  assert.equal((await makeAttempt(app.url)).response.status, 401);
  assert.equal((await app.limiters[1].getKey('one@example.com')).totalHits, 1);
});

test('100 total requests share an IP ceiling across emails and successes', async (t) => {
  const app = await startLimitedApp(t);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const outcome = attempt % 2 ? 200 : 400;
    assert.equal(
      (await makeAttempt(app.url, `person${attempt}@example.com`, outcome))
        .response.status,
      outcome,
    );
  }
  assertBlocked(
    await makeAttempt(app.url, 'another@example.com', 200),
    'Too many login attempts from this connection. Please try again later.',
  );
  assert.equal(app.handlerCalls(), 100);
});

test('email quota expires after 15 minutes and blocked retries do not extend it', async (t) => {
  t.mock.timers.enable({ apis: ['Date'] });
  const app = await startLimitedApp(t);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await makeAttempt(app.url);
  }
  t.mock.timers.tick(899000);
  const blocked = await makeAttempt(app.url);
  assert.equal(blocked.response.status, 429);
  assert.equal(Number(blocked.response.headers.get('retry-after')), 1);
  t.mock.timers.tick(1000);
  assert.equal((await makeAttempt(app.url)).response.status, 401);
});

test('application instances have independent memory-store counters', async (t) => {
  const first = await startLimitedApp(t);
  const second = await startLimitedApp(t);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await makeAttempt(first.url);
  }
  assert.equal((await makeAttempt(first.url)).response.status, 429);
  assert.equal((await makeAttempt(second.url)).response.status, 401);
  assert.equal(first.handlerCalls(), 10);
  assert.equal(second.handlerCalls(), 1);
});

test('simultaneous requests reserve email slots before downstream work', async (t) => {
  const pending = [];
  let ready;
  const tenStarted = new Promise((resolve) => {
    ready = resolve;
  });
  const app = await startLimitedApp(t, (_request, response) => {
    pending.push(response);
    if (pending.length === 10) ready();
  });
  const attempts = Array.from({ length: 10 }, () => makeAttempt(app.url));
  try {
    await tenStarted;
    assert.equal((await makeAttempt(app.url)).response.status, 429);
    assert.equal(app.handlerCalls(), 10);
  } finally {
    for (const response of pending) response.status(200).json({ ok: true });
    await Promise.all(attempts);
  }
  // Once successful requests finish, their reserved slots are refunded.
  assert.equal((await app.limiters[1].getKey('one@example.com')).totalHits, 0);
});

test('email failure allowance is shared across different client IPs', async (t) => {
  const app = await startLimitedApp(t);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await makeAttempt(app.url, 'one@example.com', 401, {
      'x-test-ip': `192.0.2.${attempt + 1}`,
    });
    assert.equal(result.response.status, 401);
  }
  const headers = { 'x-test-ip': '198.51.100.1' };
  assert.equal(
    (await makeAttempt(app.url, 'one@example.com', 200, headers)).response
      .status,
    429,
  );
  assert.equal(
    (await makeAttempt(app.url, 'two@example.com', 200, headers)).response
      .status,
    200,
  );
  assert.equal(app.handlerCalls(), 11);
});
