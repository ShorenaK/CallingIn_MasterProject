import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

const origin = 'http://localhost:5173';
const sender = new ObjectId();
const recipient = {
  _id: new ObjectId(),
  displayName: 'Recipient',
  email: 'person@example.com',
  passwordHash: 'private-hash',
};

async function setup(t, options = {}) {
  const queries = [];
  const logs = [];
  const db = {
    collection(name) {
      assert.equal(name, 'users');
      return {
        async findOne(filter, settings) {
          queries.push({ filter, settings });
          if (filter._id) return { _id: filter._id };
          if (options.failure) throw new Error('private database detail');
          if (filter.email === 'self@example.com')
            return { ...recipient, _id: sender };
          return filter.email === recipient.email ? recipient : null;
        },
      };
    },
  };
  const app = createApp(db, {
    requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
    sessionMiddleware(req, _res, next) {
      const id = req.get('X-Test-Account');
      req.session = { userId: id };
      next();
    },
  });
  app.locals.logger = { error: (...args) => logs.push(args) };
  const url = await startTestServer(t, app);
  return {
    queries,
    logs,
    post(body, account = sender, headers = {}) {
      return fetch(`${url}/api/users/lookup`, {
        method: 'POST',
        headers: {
          Origin: origin,
          'Content-Type': 'application/json',
          ...(account ? { 'X-Test-Account': account.toHexString() } : {}),
          ...headers,
        },
        body: JSON.stringify(body),
      });
    },
  };
}

test('lookup normalizes exact email and returns only ID and display name', async (t) => {
  const f = await setup(t);
  const result = await f.post({ email: '  PERSON@example.com  ' });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await result.json(), {
    user: {
      id: recipient._id.toHexString(),
      displayName: recipient.displayName,
    },
  });
  assert.deepEqual(f.queries[1], {
    filter: { email: recipient.email },
    settings: { projection: { _id: 1, displayName: 1 } },
  });
});

test('lookup rejects invalid input and injected fields before recipient queries', async (t) => {
  const f = await setup(t);
  for (const body of [
    null,
    [],
    {},
    { email: 123 },
    { email: 'bad' },
    { email: { $ne: null } },
    { email: recipient.email, extra: true },
  ]) {
    const result = await f.post(body);
    assert.equal(result.status, 400);
    await result.arrayBuffer();
  }
  assert.ok(f.queries.every(({ filter }) => filter._id));
});

test('missing and self recipients have identical not-found responses', async (t) => {
  const f = await setup(t);
  const bodies = [];
  for (const email of ['missing@example.com', 'self@example.com']) {
    const result = await f.post({ email });
    assert.equal(result.status, 404);
    bodies.push(await result.json());
  }
  assert.deepEqual(bodies[0], bodies[1]);
});

test('lookup requires authentication and trusted JSON writes', async (t) => {
  const f = await setup(t);
  for (const [account, headers, status] of [
    [null, {}, 401],
    [sender, { Origin: 'https://untrusted.example' }, 403],
    [sender, { 'Content-Type': 'text/plain' }, 415],
  ]) {
    const result = await f.post({ email: recipient.email }, account, headers);
    assert.equal(result.status, status);
    await result.arrayBuffer();
  }
  assert.deepEqual(f.queries, []);
});

test('lookup failures return safe errors and do not log submitted email', async (t) => {
  const f = await setup(t, { failure: true });
  const result = await f.post({ email: recipient.email });
  assert.equal(result.status, 503);
  const output = JSON.stringify([await result.json(), f.logs]);
  assert.doesNotMatch(output, /private|person@example.com|passwordHash/);
  assert.equal(f.logs[0][1].operation, 'recipient-lookup');
});

test('lookup counts successes and failures and isolates accounts', async (t) => {
  const f = await setup(t);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await f.post(attempt % 2 ? {} : { email: recipient.email });
    assert.equal(result.status, attempt % 2 ? 400 : 200);
    await result.arrayBuffer();
  }
  const before = f.queries.length;
  const blocked = await f.post({ email: recipient.email });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  await blocked.arrayBuffer();
  assert.equal(f.queries.length, before + 1); // Authentication only, no recipient lookup.
  const other = await f.post({ email: recipient.email }, new ObjectId());
  assert.equal(other.status, 200);
  await other.arrayBuffer();
});
