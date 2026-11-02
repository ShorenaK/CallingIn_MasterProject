import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

const sender = new ObjectId();
const recipient = new ObjectId();
const origin = 'http://localhost:5173';
const input = {
  recipientId: recipient.toHexString(),
  message: '  A private invitation  ',
};

function database(options, records, events) {
  return {
    collection(name) {
      if (name === 'users')
        return {
          async findOne(filter) {
            events.push('account');
            if (filter._id.equals(sender)) return { _id: sender };
            if (options.lookupFailure) throw new Error('private lookup');
            return options.missing ? null : { _id: filter._id };
          },
        };
      assert.equal(name, 'invitations');
      return {
        async insertOne(document) {
          events.push('insert');
          if (options.insertFailure) throw new Error('private insert');
          if (records.has(document.pairKey))
            throw Object.assign(new Error('private duplicate'), {
              code: 11000,
            });
          records.set(document.pairKey, document);
          return { insertedId: document._id };
        },
      };
    },
  };
}

async function setup(t, options = {}) {
  const records = new Map();
  const events = [];
  const logs = [];
  const app = createApp(database(options, records, events), {
    requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
    sessionMiddleware(req, _res, next) {
      req.session = { userId: req.get('X-Test-Account') };
      next();
    },
  });
  app.locals.logger = { error: (...args) => logs.push(args) };
  const url = await startTestServer(t, app);
  return {
    records,
    events,
    logs,
    post(
      body = input,
      account = sender,
      headers = {},
      path = '/api/invitations',
    ) {
      return fetch(`${url}${path}`, {
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

test('creation stores trimmed message, session identity, initial status and server dates', async (t) => {
  const f = await setup(t);
  const before = Date.now();
  const result = await f.post();
  assert.equal(result.status, 201);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  const { invitation } = await result.json();
  const stored = [...f.records.values()][0];
  assert.equal(invitation.id, stored._id.toHexString());
  assert.equal(invitation.senderId, sender.toHexString());
  assert.equal(invitation.recipientId, recipient.toHexString());
  assert.equal(invitation.message, input.message.trim());
  assert.equal(invitation.status, 'pending');
  assert.equal(invitation.respondedAt, null);
  assert.equal(invitation.createdAt, invitation.updatedAt);
  assert.ok(stored.createdAt.getTime() >= before);
  assert.ok(stored.createdAt.getTime() <= Date.now());
  assert.doesNotMatch(JSON.stringify(invitation), /pairKey|password|email/);
});

test('creation rejects invalid fields, spoofed identity and self invitations without writing', async (t) => {
  const f = await setup(t);
  for (const body of [
    null,
    [],
    {},
    { ...input, recipientId: 'invalid' },
    { ...input, message: ' ' },
    { ...input, message: 'x'.repeat(5001) },
    { ...input, senderId: new ObjectId().toHexString() },
    { ...input, status: 'accepted' },
    { ...input, recipientId: sender.toHexString() },
  ]) {
    const result = await f.post(body);
    assert.equal(result.status, 400);
    await result.arrayBuffer();
  }
  assert.equal(f.records.size, 0);
  assert.ok(!f.events.includes('insert'));
});

test('creation accepts a 5000-character message after trimming', async (t) => {
  const f = await setup(t);
  const result = await f.post({ ...input, message: `  ${'x'.repeat(5000)}  ` });
  assert.equal(result.status, 201);
  assert.equal((await result.json()).invitation.message.length, 5000);
});

test('missing recipient returns 404 without writing', async (t) => {
  const f = await setup(t, { missing: true });
  const result = await f.post();
  assert.equal(result.status, 404);
  await result.arrayBuffer();
  assert.equal(f.records.size, 0);
});

test('duplicate and reverse-direction invitations return conflict', async (t) => {
  const f = await setup(t);
  assert.equal((await f.post()).status, 201);
  for (const [body, account] of [
    [input, sender],
    [{ ...input, recipientId: sender.toHexString() }, recipient],
  ]) {
    const result = await f.post(body, account);
    assert.equal(result.status, 409);
    assert.doesNotMatch(JSON.stringify(await result.json()), /private|pairKey/);
  }
  assert.equal(f.records.size, 1);
});

test('simultaneous attempts handle the simulated unique-index conflict', async (t) => {
  const f = await setup(t);
  const results = await Promise.all([f.post(), f.post()]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  await Promise.all(results.map((r) => r.arrayBuffer()));
  assert.equal(f.records.size, 1);
});

test('creation requires authentication, trusted origin and JSON', async (t) => {
  const f = await setup(t);
  for (const [account, headers, status] of [
    [null, {}, 401],
    [sender, { Origin: 'https://untrusted.example' }, 403],
    [sender, { 'Content-Type': 'text/plain' }, 415],
  ]) {
    const result = await f.post(input, account, headers);
    assert.equal(result.status, status);
    await result.arrayBuffer();
  }
  assert.deepEqual(f.events, []);
});

test('creation storage failures do not disclose or log message content', async (t) => {
  for (const options of [{ lookupFailure: true }, { insertFailure: true }]) {
    const f = await setup(t, options);
    const result = await f.post();
    assert.equal(result.status, 503);
    assert.doesNotMatch(
      JSON.stringify([await result.json(), f.logs]),
      /private|A private invitation|pairKey/,
    );
    assert.equal(f.logs[0][1].operation, 'invitation-create');
  }
});

test('creation allowance counts all attempts, isolates accounts and is separate from lookup', async (t) => {
  const f = await setup(t);
  for (let i = 0; i < 10; i += 1) {
    const result = await f.post(i === 0 ? input : {});
    assert.equal(result.status, i === 0 ? 201 : 400);
    await result.arrayBuffer();
  }
  const blocked = await f.post();
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  await blocked.arrayBuffer();
  const other = await f.post({}, new ObjectId());
  assert.equal(other.status, 400);
  await other.arrayBuffer();
  const lookup = await f.post({}, sender, {}, '/api/users/lookup');
  assert.equal(lookup.status, 400);
  await lookup.arrayBuffer();
});

for (const [message, expected] of [
  ['😀'.repeat(2500), 201],
  ['😀'.repeat(2501), 400],
  ['\u3000'.repeat(3), 400],
  ['\u3000Hello 😀\u3000', 201],
]) {
  test(`creation enforces Unicode boundary: ${message.length} code units, expected ${expected}`, async (t) => {
    const f = await setup(t);
    const result = await f.post({ ...input, message });
    assert.equal(result.status, expected);
    const body = await result.json();
    if (expected === 201) {
      assert.equal(body.invitation.message, message.trim());
      assert.equal([...f.records.values()][0].message, message.trim());
    } else assert.equal(f.records.size, 0);
  });
}
