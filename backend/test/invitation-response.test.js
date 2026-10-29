import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

const sender = new ObjectId();
const recipient = new ObjectId();
const id = new ObjectId();
const origin = 'http://localhost:5173';

function storage(state, options) {
  function matches(filter) {
    return (
      !options.missing &&
      filter._id.equals(id) &&
      filter.recipientId.equals(recipient)
    );
  }
  return {
    collection(name) {
      if (name === 'users')
        return { findOne: async (filter) => ({ _id: filter._id }) };
      assert.equal(name, 'invitations');
      return {
        async findOneAndUpdate(filter, update, settings) {
          state.attempts += 1;
          assert.deepEqual(settings, { returnDocument: 'after' });
          if (options.writeFailure)
            throw new Error('private invitation content');
          if (
            !matches(filter) ||
            !filter.status.$in.includes(state.record.status)
          )
            return null;
          Object.assign(state.record, update.$set);
          state.writes += 1;
          return { ...state.record };
        },
        async findOne(filter) {
          if (options.readFailure) throw new Error('private database');
          return matches(filter) ? { ...state.record } : null;
        },
      };
    },
  };
}

async function setup(t, status = 'pending', options = {}) {
  const state = {
    writes: 0,
    attempts: 0,
    logs: [],
    record: {
      _id: id,
      senderId: sender,
      recipientId: recipient,
      pairKey: 'private',
      message: 'private invitation content',
      status,
      createdAt: new Date('2026-10-29T12:00:00.000Z'),
      updatedAt: new Date('2026-10-29T12:00:00.000Z'),
      respondedAt:
        status === 'pending' ? null : new Date('2026-10-29T12:00:00.000Z'),
    },
  };
  const app = createApp(storage(state, options), {
    requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
    sessionMiddleware(req, _res, next) {
      req.session = { userId: req.get('X-Test-Account') };
      next();
    },
  });
  app.locals.logger = { error: (...args) => state.logs.push(args) };
  const url = await startTestServer(t, app);
  return {
    state,
    patch(
      body,
      account = recipient,
      invitationId = id.toHexString(),
      headers = {},
    ) {
      return fetch(`${url}/api/invitations/${invitationId}/response`, {
        method: 'PATCH',
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

for (const from of ['pending', 'deferred', 'accepted', 'declined']) {
  for (const to of ['deferred', 'accepted', 'declined']) {
    test(`response ${from} to ${to} follows transition and retry rules`, async (t) => {
      const f = await setup(t, from);
      const before = { ...f.state.record };
      const result = await f.patch({ status: to });
      const permitted =
        from === 'pending' || from === 'deferred' || from === to;
      assert.equal(result.status, permitted ? 200 : 409);
      assert.equal(result.headers.get('cache-control'), 'no-store');
      const body = await result.json();
      if (from === to) {
        assert.equal(body.invitation.status, before.status);
        assert.equal(body.invitation.createdAt, before.createdAt.toISOString());
        assert.equal(body.invitation.updatedAt, before.updatedAt.toISOString());
        assert.equal(
          body.invitation.respondedAt,
          before.respondedAt.toISOString(),
        );
      }
      if (!permitted || from === to) {
        assert.equal(f.state.writes, 0);
        assert.deepEqual(f.state.record, before);
      } else {
        assert.equal(f.state.writes, 1);
        assert.equal(body.invitation.status, to);
        assert.equal(body.invitation.updatedAt, body.invitation.respondedAt);
        assert.notEqual(
          body.invitation.updatedAt,
          before.updatedAt.toISOString(),
        );
        assert.equal(body.invitation.createdAt, before.createdAt.toISOString());
      }
    });
  }
}

test('sender, outsiders and missing invitations receive identical 404 responses', async (t) => {
  const f = await setup(t);
  const bodies = [];
  for (const [account, invitationId] of [
    [sender, id],
    [new ObjectId(), id],
    [recipient, new ObjectId()],
  ]) {
    const result = await f.patch(
      { status: 'accepted' },
      account,
      invitationId.toHexString(),
    );
    assert.equal(result.status, 404);
    bodies.push(await result.json());
  }
  assert.deepEqual(bodies[0], bodies[1]);
  assert.deepEqual(bodies[1], bodies[2]);
  assert.equal(f.state.writes, 0);
});

test('invalid IDs, statuses and additional fields never reach invitation storage', async (t) => {
  const f = await setup(t);
  for (const body of [
    null,
    [],
    {},
    { status: 'pending' },
    { status: 123 },
    { status: 'accepted', recipientId: sender.toHexString() },
    { status: 'declined', message: 'changed' },
  ]) {
    const result = await f.patch(body);
    assert.equal(result.status, 400);
    await result.arrayBuffer();
  }
  const badId = await f.patch({ status: 'accepted' }, recipient, 'invalid');
  assert.equal(badId.status, 400);
  await badId.arrayBuffer();
  assert.equal(f.state.attempts, 0);
});

test('response route requires authentication, trusted origin and JSON', async (t) => {
  const f = await setup(t);
  for (const [account, headers, expected] of [
    [null, {}, 401],
    [recipient, { Origin: 'https://untrusted.example' }, 403],
    [recipient, { 'Content-Type': 'text/plain' }, 415],
  ]) {
    const result = await f.patch(
      { status: 'accepted' },
      account,
      id.toHexString(),
      headers,
    );
    assert.equal(result.status, expected);
    await result.arrayBuffer();
  }
  assert.equal(f.state.attempts, 0);
});

test('conflicting simultaneous final responses produce one winner', async (t) => {
  const f = await setup(t);
  const results = await Promise.all([
    f.patch({ status: 'accepted' }),
    f.patch({ status: 'declined' }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  await Promise.all(results.map((r) => r.arrayBuffer()));
  assert.equal(f.state.writes, 1);
});

test('response storage failures hide private content in errors and logs', async (t) => {
  for (const options of [{ writeFailure: true }, { readFailure: true }]) {
    const f = await setup(t, 'accepted', options);
    const result = await f.patch({ status: 'declined' });
    assert.equal(result.status, 503);
    assert.doesNotMatch(
      JSON.stringify([await result.json(), f.state.logs]),
      /private|pairKey/,
    );
    assert.equal(f.state.logs[0][1].operation, 'invitation-response');
  }
});
