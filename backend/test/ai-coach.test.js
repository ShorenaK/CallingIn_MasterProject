import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { CoachFailure } from '../src/ai-coach-provider.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

const origin = 'http://localhost:5173';
const account = String(new ObjectId());
const valid = {
  action: 'draft',
  text: ' Invite a friend for tea ',
  tone: 'warm',
};

function accountDatabase(state, options) {
  return {
    collection(name) {
      assert.equal(name, 'users');
      return {
        async findOne() {
          state.reads += 1;
          await options.beforeAccountRead?.();
          if (options.dbFailure) throw new Error('private database error');
          return options.deleted ? null : {};
        },
      };
    },
  };
}

async function setup(t, options = {}) {
  const state = { calls: [], logs: [], reads: 0 };
  const db = accountDatabase(state, options);
  const generate = async (input, signal) => {
    state.calls.push({ input, signal });
    return options.generate
      ? options.generate(input, signal)
      : ' Would you like some tea? ';
  };
  const app = createApp(
    db,
    {
      requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
      sessionMiddleware(req, _res, next) {
        options.onResponse?.(_res);
        req.session = {
          userId: req.get('X-Test-Account'),
          destroy: (done) => done(),
        };
        next();
      },
    },
    {
      generate: options.unconfigured ? undefined : generate,
      timeoutMs: options.timeoutMs,
    },
  );
  app.locals.logger = { error: (...args) => state.logs.push(args) };
  const url = await startTestServer(t, app);
  async function request(input = {}) {
    const response = await fetch(`${url}/api/ai-coach/suggestions`, {
      method: 'POST',
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'X-Test-Account': account,
        ...input.headers,
      },
      body: input.raw ?? JSON.stringify(input.body ?? valid),
      signal: input.signal,
    });
    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  }
  return { state, request };
}

test('Coach returns only trimmed text and passes no account/database context to provider', async (t) => {
  const f = await setup(t);
  for (const action of ['draft', 'refine']) {
    const result = await f.request({ body: { ...valid, action } });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { suggestion: 'Would you like some tea?' });
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.deepEqual(f.state.calls.at(-1).input, {
      ...valid,
      action,
      text: valid.text.trim(),
    });
  }
});

test('unconfigured Coach is unavailable, never a fake successful generation', async (t) => {
  const f = await setup(t, { unconfigured: true });
  assert.equal((await f.request()).status, 503);
  assert.equal(f.state.calls.length, 0);
});

test('invalid bodies, unknown context and enum types never reach provider', async (t) => {
  const bodies = [
    null,
    [],
    {},
    { ...valid, text: '' },
    { ...valid, text: '\u200b\u0001' },
    { ...valid, text: 3 },
    { ...valid, text: 'a'.repeat(5001) },
    { ...valid, action: ['draft'] },
    { ...valid, tone: ['warm'] },
    { ...valid, action: 'send' },
    { ...valid, tone: 'persuasive' },
    { ...valid, recipientId: account },
    { ...valid, history: [] },
  ];
  for (const body of bodies) {
    const f = await setup(t);
    assert.equal((await f.request({ raw: JSON.stringify(body) })).status, 400);
    assert.equal(f.state.calls.length, 0);
  }
});

test('text boundary accepts 5000 UTF-16 units and preserves multilingual joiners', async (t) => {
  const f = await setup(t, { generate: async (input) => input.text });
  for (const text of [
    'a'.repeat(5000),
    '😀'.repeat(2500),
    'გამარჯობა 👨‍👩‍👧‍👦 سلام',
  ]) {
    const result = await f.request({ body: { ...valid, text } });
    assert.equal(result.status, 200);
    assert.equal(result.body.suggestion, text);
  }
});

test('origin/media/body guards reject before account/provider work', async (t) => {
  for (const [input, expected] of [
    [{ headers: { Origin: '' }, raw: '{' }, 403],
    [{ headers: { Origin: 'https://untrusted.example' } }, 403],
    [{ headers: { 'Content-Type': 'text/plain' } }, 415],
    [{ raw: '{' }, 400],
    [{ body: { ...valid, text: 'a'.repeat(17000) } }, 413],
  ]) {
    const f = await setup(t);
    assert.equal((await f.request(input)).status, expected);
    assert.equal(f.state.calls.length, 0);
    assert.equal(f.state.reads, 0);
  }
});

test('missing, invalid and deleted accounts cannot generate', async (t) => {
  for (const id of ['', 'invalid']) {
    const f = await setup(t);
    assert.equal(
      (await f.request({ headers: { 'X-Test-Account': id } })).status,
      401,
    );
    assert.equal(f.state.calls.length, 0);
  }
  const f = await setup(t, { deleted: true });
  assert.equal((await f.request()).status, 401);
  assert.equal(f.state.calls.length, 0);
});

test('account storage failure does not dispatch a provider call', async (t) => {
  const f = await setup(t, { dbFailure: true });
  assert.equal((await f.request()).status, 503);
  assert.equal(f.state.calls.length, 0);
});

test('invalid provider output is rejected without exposing raw output', async (t) => {
  for (const output of [
    undefined,
    null,
    {},
    { suggestion: 'hello' },
    '',
    '\u200b',
    'secret'.repeat(1000),
  ]) {
    const f = await setup(t, { generate: async () => output });
    const result = await f.request();
    assert.equal(result.status, 502);
    assert.equal(JSON.stringify(result.body).includes('secret'), false);
  }
});

test('refusals, unavailable service and arbitrary failures map to safe responses/logs', async (t) => {
  for (const [error, status] of [
    [new CoachFailure('refused'), 422],
    [new CoachFailure('unavailable'), 503],
    [new Error('private api-key prompt'), 503],
  ]) {
    const f = await setup(t, {
      generate: async () => {
        throw error;
      },
    });
    const result = await f.request();
    assert.equal(result.status, status);
    assert.equal(
      JSON.stringify([result.body, f.state.logs]).includes('private'),
      false,
    );
    assert.equal(
      JSON.stringify(f.state.logs).includes(valid.text.trim()),
      false,
    );
  }
});

test('deadline aborts ignored provider work and releases account for retry', async (t) => {
  let calls = 0;
  const f = await setup(t, {
    timeoutMs: 15,
    generate: async () => {
      calls += 1;
      return calls === 1 ? new Promise(() => {}) : 'Try again';
    },
  });
  assert.equal((await f.request()).status, 504);
  assert.equal(f.state.calls[0].signal.aborted, true);
  assert.equal((await f.request()).status, 200);
});

test('five attempts per minute are account-scoped and block before provider', async (t) => {
  const f = await setup(t);
  for (let i = 0; i < 5; i += 1) assert.equal((await f.request()).status, 200);
  const result = await f.request();
  assert.equal(result.status, 429);
  assert.ok(result.headers.get('retry-after'));
  assert.equal(f.state.calls.length, 5);
  assert.equal(
    (await f.request({ headers: { 'X-Test-Account': String(new ObjectId()) } }))
      .status,
    200,
  );
});

test('concurrent account request is blocked until completion', async (t) => {
  let resolve;
  let started;
  const ready = new Promise((done) => {
    started = done;
  });
  const f = await setup(t, {
    generate: async () => {
      started();
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  const first = f.request();
  await ready;
  const blocked = await f.request();
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
  resolve('First result');
  assert.equal((await first).status, 200);
  assert.equal(f.state.calls.length, 1);
});

test('client cancellation aborts work and releases the account', async (t) => {
  let start;
  let aborted;
  const ready = new Promise((done) => {
    start = done;
  });
  const cancelled = new Promise((done) => {
    aborted = done;
  });
  let count = 0;
  const f = await setup(t, {
    generate: async (_input, signal) => {
      count += 1;
      if (count > 1) return 'Recovered';
      signal.addEventListener('abort', aborted, { once: true });
      start();
      return new Promise(() => {});
    },
  });
  const controller = new AbortController();
  const first = f.request({ signal: controller.signal });
  const rejected = assert.rejects(first, { name: 'AbortError' });
  await ready;
  controller.abort();
  await rejected;
  await cancelled;
  assert.equal((await f.request()).status, 200);
  assert.equal(f.state.logs.length, 0);
});

test('late provider rejection after timeout cannot leak or change the response', async (t) => {
  let rejectLate;
  const f = await setup(t, {
    timeoutMs: 10,
    generate: async () =>
      new Promise((_resolve, reject) => {
        rejectLate = reject;
      }),
  });
  const result = await f.request();
  assert.equal(result.status, 504);
  rejectLate(new Error('secret late provider failure'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.state.logs.length, 0);
  assert.equal(JSON.stringify(result.body).includes('secret'), false);
});

test('invalid deadline configuration fails setup', () => {
  for (const timeoutMs of [0, -1, 20001, NaN, 1.5])
    assert.throws(
      () =>
        createApp(
          undefined,
          {
            sessionMiddleware: (_req, _res, next) => next(),
            requestProtection: (_req, _res, next) => next(),
          },
          { timeoutMs },
        ),
      /Coach timeout/,
    );
});

test('disconnect during account verification prevents any provider dispatch', async (t) => {
  let entered;
  let release;
  let closed;
  const reading = new Promise((resolve) => {
    entered = resolve;
  });
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const disconnected = new Promise((resolve) => {
    closed = resolve;
  });
  const f = await setup(t, {
    beforeAccountRead: async () => {
      entered();
      await held;
    },
    onResponse: (response) => response.once('close', closed),
  });
  const controller = new AbortController();
  const request = f.request({ signal: controller.signal });
  const rejected = assert.rejects(request, { name: 'AbortError' });
  await reading;
  controller.abort();
  await rejected;
  await disconnected;
  release();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.state.calls.length, 0);
  assert.equal(f.state.logs.length, 0);
});
