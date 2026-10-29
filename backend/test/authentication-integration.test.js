import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { EventEmitter } from 'node:events';
import { startBackend } from '../src/lifecycle.js';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createSessionMiddleware } from '../src/session.js';
import { createRequestProtection } from '../src/request-protection.js';
import { hashPassword } from '../src/registration.js';
import { startTestServer } from '../test-support/server.js';

const origin = 'http://127.0.0.1:5173';
const password = 'Public integration test password';
let account;
before(async () => {
  account = {
    _id: new ObjectId(),
    displayName: 'Test Person',
    email: 'test@example.com',
    passwordHash: await hashPassword(password),
  };
});

function simulatedDatabase() {
  const records = new Map();
  // Real Express/session/store modules operate against this narrow MongoDB fake.
  // It checks route integration, not Atlas permissions or MongoDB TTL cleanup.
  const sessions = {
    createIndex: async () => 'expires_1',
    findOne: async (filter) => {
      const record = records.get(filter._id);
      return record && record.expires > filter.$or[1].expires.$gt
        ? record
        : null;
    },
    updateOne: async (filter, update) => {
      const exists = records.has(filter._id);
      records.set(filter._id, { ...records.get(filter._id), ...update.$set });
      return { upsertedCount: exists ? 0 : 1, matchedCount: exists ? 1 : 0 };
    },
    deleteOne: async (filter) => ({
      deletedCount: Number(records.delete(filter._id)),
    }),
  };
  const profile = { ...account };
  const users = {
    createIndex: async (keys, options) => {
      assert.deepEqual(keys, { email: 1 });
      assert.deepEqual(options, { unique: true });
    },
    findOneAndUpdate: async (filter, update, options) => {
      assert.deepEqual(options, {
        returnDocument: 'after',
        projection: { displayName: 1, email: 1 },
      });
      if (!filter._id.equals(profile._id)) return null;
      assert.deepEqual(Object.keys(update.$set), ['displayName']);
      Object.assign(profile, update.$set);
      return profile;
    },
    findOne: async (filter) => {
      if (filter.email) return filter.email === profile.email ? profile : null;
      return filter._id.equals(profile._id) ? profile : null;
    },
  };
  const db = {
    databaseName: 'auth_integration_test',
    listCollections: () => ({ next: async () => null }),
    createCollection: async (name) => assert.equal(name, 'invitations'),
    collection(name) {
      if (name === 'users') return users;
      if (name === 'invitations') return { createIndex: async () => {} };
      assert.equal(name, 'sessions');
      return sessions;
    },
  };
  db.client = {
    db: (name) => {
      assert.equal(name, db.databaseName);
      return db;
    },
  };
  return { db, records };
}

async function setup(t) {
  const { db, records } = simulatedDatabase();
  const env = {
    APP_ORIGIN: origin,
    SESSION_SECRET: 'public-test-secret-at-least-32-bytes',
  };
  const app = createApp(db, {
    requestProtection: createRequestProtection(env),
    sessionMiddleware: await createSessionMiddleware(db, env),
  });
  return { url: await startTestServer(t, app), records };
}

async function post(url, path, body, options = {}) {
  const { cookie, requestOrigin = origin } = options;
  const headers = { 'Content-Type': 'application/json' };
  if (requestOrigin) headers.Origin = requestOrigin;
  if (cookie) headers.Cookie = cookie;
  return fetch(`${url}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

for (const keepSignedIn of [true, false]) {
  test(`connected login/current-user/logout flow with keepSignedIn=${keepSignedIn}`, async (t) => {
    const { url, records } = await setup(t);
    const anonymous = await fetch(`${url}/api/auth/me`);
    assert.equal(anonymous.status, 401);
    await anonymous.arrayBuffer();
    const beforeLogin = Date.now();
    const login = await post(url, '/api/auth/login', {
      email: account.email,
      password,
      keepSignedIn,
    });
    assert.equal(login.status, 200);
    const body = await login.json();
    assert.deepEqual(body.user, {
      id: account._id.toHexString(),
      email: account.email,
      displayName: account.displayName,
    });
    const setCookie = login.headers.get('set-cookie');
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    assertCookieExpiry(setCookie, keepSignedIn, beforeLogin);
    const cookie = setCookie.split(';')[0];
    const me = await fetch(`${url}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), body);
    assert.equal(me.headers.get('cache-control'), 'no-store');
    const logout = await post(url, '/api/auth/logout', {}, { cookie });
    assert.equal(logout.status, 204);
    assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
    assert.equal(records.size, 0);
    // Replay the old cookie to prove server invalidation, not just browser clearing.
    const replay = await fetch(`${url}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal(replay.status, 401);
    await replay.arrayBuffer();
  });
}

test('untrusted writes and non-JSON bodies are rejected before authentication', async (t) => {
  const { url, records } = await setup(t);
  for (const requestOrigin of [null, 'https://untrusted.example']) {
    const result = await post(
      url,
      '/api/auth/login',
      { email: account.email, password },
      { requestOrigin },
    );
    assert.equal(result.status, 403);
    await result.arrayBuffer();
  }
  const plain = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'text/plain' },
    body: '{}',
  });
  assert.equal(plain.status, 415);
  await plain.arrayBuffer();
  assert.equal(records.size, 0);
});

test('wrong credentials create no session and repeated requests reach the limiter', async (t) => {
  const { url, records } = await setup(t);
  const wrong = await post(url, '/api/auth/login', {
    email: account.email,
    password: 'Wrong but valid-length test password',
  });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.get('set-cookie'), null);
  await wrong.arrayBuffer();
  // Invalid inputs still consume quota; do not run ten expensive hashes merely
  // to verify that the actual login route is behind its rate limiter.
  for (let attempt = 2; attempt <= 10; attempt += 1) {
    const result = await post(url, '/api/auth/login', {});
    assert.equal(result.status, 400);
    await result.arrayBuffer();
  }
  const blocked = await post(url, '/api/auth/login', {});
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  await blocked.arrayBuffer();
  assert.equal(records.size, 0);
});

function patchProfile(url, body, headers = {}) {
  return fetch(`${url}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test('profile route requires a signed-in session', async (t) => {
  const { url } = await setup(t);
  assert.equal(
    (await patchProfile(url, { displayName: 'Updated' })).status,
    401,
  );
});

test('profile route persists edits for the signed-in account behind origin and JSON protection', async (t) => {
  const { url } = await setup(t);
  const login = await post(url, '/api/auth/login', {
    email: account.email,
    password,
  });
  assert.equal(login.status, 200);
  const Cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal(
    (
      await patchProfile(
        url,
        { displayName: 'Untrusted' },
        { Cookie, Origin: 'https://untrusted.example' },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await patchProfile(
        url,
        { displayName: 'Wrong type' },
        { Cookie, 'Content-Type': 'text/plain' },
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await patchProfile(
        url,
        { displayName: 'Name', userId: new ObjectId().toHexString() },
        { Cookie },
      )
    ).status,
    400,
  );
  const updated = await patchProfile(
    url,
    { displayName: '  Updated Profile  ' },
    { Cookie },
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.headers.get('cache-control'), 'no-store');
  const expected = {
    user: {
      id: account._id.toHexString(),
      email: account.email,
      displayName: 'Updated Profile',
    },
  };
  assert.deepEqual(await updated.json(), expected);
  const me = await fetch(`${url}/api/auth/me`, { headers: { Cookie } });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), expected);
});

function assertCookieExpiry(cookie, persistent, before) {
  const expiry = /(?:^|; )Expires=([^;]+)/.exec(cookie);
  if (!persistent) {
    assert.equal(expiry, null);
    assert.doesNotMatch(cookie, /Max-Age=/i);
    return;
  }
  assert.ok(expiry, 'Persistent login must set cookie expiry');
  const timestamp = Date.parse(expiry[1]);
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  // HTTP cookie dates have second precision; allow only that rounding loss.
  assert.ok(timestamp >= before + ninetyDays - 1000);
  assert.ok(timestamp <= Date.now() + ninetyDays);
}

test('login replaces an existing session ID and rejects replay of the old cookie', async (t) => {
  const { url, records } = await setup(t);
  const credentials = { email: account.email, password };
  const first = await post(url, '/api/auth/login', credentials);
  assert.equal(first.status, 200);
  const oldCookie = first.headers.get('set-cookie').split(';')[0];
  const oldId = [...records.keys()][0];
  const second = await post(url, '/api/auth/login', credentials, {
    cookie: oldCookie,
  });
  assert.equal(second.status, 200);
  const newCookie = second.headers.get('set-cookie').split(';')[0];
  assert.notEqual(newCookie, oldCookie);
  assert.equal(records.has(oldId), false);
  assert.equal(records.size, 1);
  const replay = await fetch(`${url}/api/auth/me`, {
    headers: { Cookie: oldCookie },
  });
  assert.equal(replay.status, 401);
  const active = await fetch(`${url}/api/auth/me`, {
    headers: { Cookie: newCookie },
  });
  assert.equal(active.status, 200);
  assert.equal((await active.json()).user.id, account._id.toHexString());
});

test('real startup wires origin protection, Mongo-backed sessions, and account routes', async (t) => {
  const { db, records } = simulatedDatabase();
  let closed = 0;
  // Only connection/runtime/log output are replaced. Account index preparation,
  // prepareAuthentication, createApp, and session middleware use real defaults.
  const running = await startBackend({
    port: 0,
    env: {
      APP_ORIGIN: origin,
      SESSION_SECRET: 'public-startup-test-secret-at-least-32-bytes',
    },
    connect: async () => ({
      db,
      close: async () => {
        closed += 1;
      },
    }),
    runtime: new EventEmitter(),
    logger: { log() {} },
  });
  t.after(running.stop);
  const url = `http://127.0.0.1:${running.server.address().port}`;
  const rejected = await post(
    url,
    '/api/auth/login',
    {},
    { requestOrigin: 'https://untrusted.example' },
  );
  assert.equal(rejected.status, 403);
  assert.equal(records.size, 0);
  const anonymous = await fetch(`${url}/api/auth/me`);
  assert.equal(anonymous.status, 401);
  const login = await post(url, '/api/auth/login', {
    email: account.email,
    password,
  });
  assert.equal(login.status, 200);
  assert.equal(records.size, 1);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const me = await fetch(`${url}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.id, account._id.toHexString());
  await running.stop();
  assert.equal(closed, 1);
  assert.equal(running.server.listening, false);
});
