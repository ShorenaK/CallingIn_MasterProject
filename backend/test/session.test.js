import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import {
  createSessionMiddleware,
  setSessionPersistence,
} from '../src/session.js';
import { startTestServer } from '../test-support/server.js';

// A public test-only value. No private environment settings or Atlas access.
const settings = { SESSION_SECRET: 'test-only-session-secret-with-32-bytes' };
const ninetyDays = 90 * 24 * 60 * 60 * 1000;

function fakeDatabase() {
  const records = new Map();
  const indexes = [];
  const collection = {
    createIndex: async (...args) => indexes.push(args),
    updateOne: async (filter, update) => {
      const existing = records.has(filter._id);
      records.set(filter._id, { ...records.get(filter._id), ...update.$set });
      return {
        upsertedCount: existing ? 0 : 1,
        matchedCount: existing ? 1 : 0,
      };
    },
    // Honor the store's expiry query so expired records need not await TTL cleanup.
    findOne: async (filter) => {
      const record = records.get(filter._id);
      return record && record.expires > filter.$or[1].expires.$gt
        ? record
        : null;
    },
  };
  const db = {
    databaseName: 'session_test',
    collection: (name) => {
      assert.equal(name, 'sessions');
      return collection;
    },
  };
  db.client = {
    db: (name) => {
      assert.equal(name, db.databaseName);
      return db;
    },
  };
  return { db, records, indexes };
}

async function sessionServer(t, env = settings) {
  const storage = fakeDatabase();
  const app = express();
  app.use(await createSessionMiddleware(storage.db, env));
  // This test route isolates cookie persistence from the real login handler.
  app.get('/start/:remember', (req, res) => {
    req.session.userId = 'test-user';
    setSessionPersistence(req.session, req.params.remember === 'yes');
    res.json({ ok: true });
  });
  app.get('/read', (req, res) => {
    res.json({ userId: req.session.userId ?? null });
  });
  const url = await startTestServer(t, app);
  return { ...storage, url };
}

test('missing and short secrets fail before accessing storage', async () => {
  for (const secret of [undefined, '', 'short']) {
    await assert.rejects(
      createSessionMiddleware({}, { SESSION_SECRET: secret }),
      /SESSION_SECRET must contain at least 32 bytes/,
    );
  }
});

test('index setup failure prevents middleware creation', async () => {
  const { db } = fakeDatabase();
  db.collection = () => ({
    createIndex: async () => {
      throw new Error('index unavailable');
    },
  });
  await assert.rejects(
    createSessionMiddleware(db, settings),
    /index unavailable/,
  );
});

test('anonymous requests neither set cookies nor save sessions', async (t) => {
  const { url, records, indexes } = await sessionServer(t);
  assert.deepEqual(indexes, [[{ expires: 1 }, { expireAfterSeconds: 0 }]]);
  const response = await fetch(`${url}/read`);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(records.size, 0);
});

for (const remember of ['yes', 'no']) {
  test(`remember=${remember} enforces inactivity expiry and cookie choice`, async (t) => {
    const { url, records } = await sessionServer(t);
    const before = Date.now();
    const response = await fetch(`${url}/start/${remember}`);
    const cookie = response.headers.get('set-cookie');
    assert.match(cookie, /^callingin\.sid=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.doesNotMatch(cookie, /; Secure/);
    assert.equal(cookie.includes('Expires='), remember === 'yes');
    const record = [...records.values()][0];
    assert.ok(record.expires.getTime() >= before + ninetyDays);
    assert.ok(record.expires.getTime() <= Date.now() + ninetyDays);
    const headers = { cookie: cookie.split(';')[0] };
    // Expiry refresh must work even when the session data itself is unchanged.
    record.expires = new Date(Date.now() + 1000);
    const read = await fetch(`${url}/read`, { headers });
    assert.deepEqual(await read.json(), { userId: 'test-user' });
    assert.ok(records.get(record._id).expires.getTime() >= before + ninetyDays);
    assert.equal(
      read.headers.get('set-cookie')?.includes('Expires=') ?? false,
      remember === 'yes',
    );
    records.get(record._id).expires = new Date(Date.now() - 1000);
    const expired = await fetch(`${url}/read`, { headers });
    assert.deepEqual(await expired.json(), { userId: null });
  });
}

test('production refuses to send a secure session cookie over plain HTTP', async (t) => {
  const { url } = await sessionServer(t, {
    ...settings,
    NODE_ENV: 'production',
  });
  const response = await fetch(`${url}/start/yes`);
  assert.equal(response.headers.get('set-cookie'), null);
});
