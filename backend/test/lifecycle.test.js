import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import { test } from 'node:test';
import { startBackend, configureShutdown } from '../src/lifecycle.js';

function setup() {
  const runtime = new EventEmitter();
  runtime.exit = (code) => runtime.emit('exit-result', code);
  const state = { closes: 0, prepared: false, logs: [] };
  const db = {};
  const options = {
    port: 0,
    runtime,
    connect: async () => ({
      db,
      close: async () => {
        state.closes += 1;
      },
    }),
    prepare: async (value) => {
      assert.equal(value, db);
      state.prepared = true;
    },
    logger: { log: (message) => state.logs.push(message) },
  };
  return { options, state, runtime };
}

test('startup prepares storage before serving health, and stop closes all resources once', async (t) => {
  const { options, state, runtime } = setup();
  const { server, stop } = await startBackend(options);
  t.after(stop);
  assert.equal(state.prepared, true);
  assert.equal(state.logs.length, 2);
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/health`,
  );
  assert.deepEqual(await response.json(), { status: 'ok' });
  const first = stop();
  assert.equal(stop(), first);
  await first;
  assert.equal(state.closes, 1);
  assert.equal(server.listening, false);
  assert.equal(runtime.listenerCount('SIGINT'), 0);
  assert.equal(runtime.listenerCount('SIGTERM'), 0);
});

test('connection failure does not initialize storage or start HTTP', async () => {
  const { options, state } = setup();
  options.connect = async () => {
    throw new Error('Safe connection failure');
  };
  await assert.rejects(startBackend(options), /Safe connection failure/);
  assert.equal(state.prepared, false);
  assert.deepEqual(state.logs, []);
});

test('index setup failure closes the database and hides private details', async () => {
  const { options, state, runtime } = setup();
  options.prepare = async () => {
    throw new Error('private index details');
  };
  await assert.rejects(startBackend(options), {
    message:
      'Account storage setup failed. Check database permissions and existing accounts.',
  });
  assert.equal(state.closes, 1);
  assert.deepEqual(state.logs, []);
  assert.equal(runtime.listenerCount('SIGINT'), 0);
});

test('cleanup failure during setup preserves the safe startup error', async () => {
  const { options } = setup();
  options.connect = async () => ({
    db: {},
    close: async () => {
      throw new Error('private cleanup');
    },
  });
  options.prepare = async () => {
    throw new Error('private setup');
  };
  await assert.rejects(startBackend(options), /Account storage setup failed/);
});

test('a real occupied port fails safely and closes the second database', async (t) => {
  const first = await startBackend(setup().options);
  t.after(first.stop);
  const { options, state } = setup();
  options.port = first.server.address().port;
  await assert.rejects(startBackend(options), {
    message:
      'CallingIn backend failed to listen. Check the port configuration.',
  });
  assert.equal(state.closes, 1);
  assert.deepEqual(state.logs, []);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`${signal} closes HTTP and database before successful exit`, async (t) => {
    const { options, state, runtime } = setup();
    const running = await startBackend(options);
    t.after(running.stop);
    const exit = once(runtime, 'exit-result');
    runtime.emit(signal);
    assert.deepEqual(await exit, [0]);
    assert.equal(state.closes, 1);
    assert.equal(running.server.listening, false);
  });
}

test('shutdown database failure exits with failure and removes signal listeners', async () => {
  const { options, runtime } = setup();
  options.prepare = async () => {};
  options.connect = async () => ({
    db: {},
    close: async () => {
      throw new Error('private cleanup');
    },
  });
  await startBackend(options);
  const exit = once(runtime, 'exit-result');
  runtime.emit('SIGTERM');
  assert.deepEqual(await exit, [1]);
  assert.equal(runtime.listenerCount('SIGINT'), 0);
});

test('shutdown HTTP close failure still closes the database and rejects', async () => {
  let closed = false;
  const runtime = new EventEmitter();
  const stop = configureShutdown(
    {
      close: (callback) => callback(new Error('close failed')),
      closeIdleConnections() {},
    },
    {
      close: async () => {
        closed = true;
      },
    },
    { runtime, timers: { setTimeout, clearTimeout }, shutdownTimeoutMs: 10000 },
  );
  await assert.rejects(stop(), /close failed/);
  assert.equal(closed, true);
});

test('shutdown deadline requests a failing exit if HTTP does not finish', async () => {
  const runtime = new EventEmitter();
  const exits = [];
  runtime.exit = (code) => exits.push(code);
  let expire;
  let finish;
  let cleared = false;
  const deadline = { unref() {} };
  const timers = {
    setTimeout: (callback, delay) => {
      assert.equal(delay, 10000);
      expire = callback;
      return deadline;
    },
    clearTimeout: (handle) => {
      assert.equal(handle, deadline);
      cleared = true;
    },
  };
  const stop = configureShutdown(
    {
      close: (callback) => {
        finish = callback;
      },
      closeIdleConnections() {},
    },
    { close: async () => {} },
    { runtime, timers, shutdownTimeoutMs: 10000 },
  );
  const stopped = stop();
  expire();
  assert.deepEqual(exits, [1]);
  finish();
  await stopped;
  assert.equal(cleared, true);
});
