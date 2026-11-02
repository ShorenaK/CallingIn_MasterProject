import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

const sender = new ObjectId();
const recipient = new ObjectId();
const invitationId = new ObjectId();
const origin = 'http://localhost:5173';

function roomStorage(state, options) {
  return {
    async findOneAndUpdate(filter, update, settings) {
      assert.deepEqual(filter, { invitationId });
      assert.deepEqual(settings, { upsert: true, returnDocument: 'after' });
      if (options.writeFailure) throw new Error('private room');
      if (options.nullResult) return null;
      if (!state.room) {
        state.room = {
          _id: new ObjectId(),
          invitationId,
          ...update.$setOnInsert,
        };
        state.writes += 1;
        if (options.duplicate)
          throw Object.assign(new Error('private duplicate'), {
            code: 11000,
          });
      }
      return state.room;
    },
    async findOne(filter) {
      assert.deepEqual(filter, { invitationId });
      if (options.recoveryFailure) throw new Error('private recovery');
      return options.recoveryMissing ? null : state.room;
    },
  };
}

function simulatedDatabase(state, options, invitation) {
  const db = {
    collection(name) {
      if (name === 'users')
        return { findOne: async () => (options.deleted ? null : {}) };
      if (name === 'invitations')
        return {
          findOne: async (filter) => {
            state.invitationReads += 1;
            if (options.readFailure) throw new Error('private invitation');
            assert.deepEqual(
              filter.$or.map((entry) => Object.values(entry)[0].toHexString()),
              [options.account ?? recipient, options.account ?? recipient].map(
                String,
              ),
            );
            return !options.missing &&
              filter._id.equals(invitationId) &&
              [sender, recipient].some((id) =>
                id.equals(filter.$or[0].senderId),
              )
              ? invitation
              : null;
          },
        };
      assert.equal(name, 'conversations');
      return roomStorage(state, options);
    },
  };
  return db;
}

async function setup(t, options = {}) {
  const state = { room: null, writes: 0, logs: [], invitationReads: 0 };
  const invitation = {
    _id: invitationId,
    senderId: sender,
    recipientId: recipient,
    status: options.status ?? 'accepted',
  };
  const db = simulatedDatabase(state, options, invitation);
  const app = createApp(db, {
    requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
    sessionMiddleware(req, _res, next) {
      req.session = {
        userId: req.get('X-Test-Account'),
        destroy: (callback) => callback(),
      };
      next();
    },
  });
  app.locals.logger = { error: (...args) => state.logs.push(args) };
  const url = await startTestServer(t, app);
  return {
    state,
    async open(overrides = {}) {
      const result = await fetch(
        `${url}/api/invitations/${overrides.id ?? invitationId}/conversation`,
        {
          method: 'POST',
          headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            'X-Test-Account': String(options.account ?? recipient),
            ...overrides.headers,
          },
          body: overrides.raw ?? JSON.stringify(overrides.body ?? {}),
        },
      );
      return {
        status: result.status,
        body: await result.json(),
        cache: result.headers.get('cache-control'),
      };
    },
  };
}

for (const account of [sender, recipient]) {
  test(`participant ${account} opens and retries the same conversation`, async (t) => {
    const f = await setup(t, { account });
    const first = await f.open();
    assert.equal(first.status, 200);
    assert.equal(first.cache, 'no-store');
    assert.deepEqual(first.body.conversation.participantIds, [
      String(sender),
      String(recipient),
    ]);
    assert.equal(first.body.conversation.invitationId, String(invitationId));
    assert.deepEqual(await f.open(), first);
    assert.equal(f.state.writes, 1);
  });
}

test('simultaneous opens return the same room and creation time', async (t) => {
  const f = await setup(t);
  const results = await Promise.all(Array.from({ length: 8 }, () => f.open()));
  for (const result of results) assert.deepEqual(result, results[0]);
  assert.equal(results[0].status, 200);
  assert.equal(f.state.writes, 1);
});

test('outsiders and missing invitations have identical responses without room writes', async (t) => {
  const outsider = await setup(t, { account: new ObjectId() });
  const missing = await setup(t, { missing: true });
  assert.deepEqual(await outsider.open(), await missing.open());
  assert.equal((await outsider.open()).status, 404);
  assert.equal(outsider.state.writes + missing.state.writes, 0);
});

for (const status of ['pending', 'deferred', 'declined']) {
  test(`${status} invitations cannot open rooms`, async (t) => {
    const f = await setup(t, { status });
    assert.equal((await f.open()).status, 409);
    assert.equal(f.state.writes, 0);
  });
}

test('invalid IDs and client-supplied fields are rejected before invitation storage', async (t) => {
  const f = await setup(t);
  for (const overrides of [
    { id: 'bad' },
    { body: { participantIds: [sender] } },
    { body: [] },
    { raw: 'null' },
    { body: { invitationId } },
  ]) {
    assert.equal((await f.open(overrides)).status, 400);
  }
  assert.equal(f.state.invitationReads, 0);
});

test('session, origin, JSON and verified-account protections apply', async (t) => {
  const f = await setup(t);
  for (const [headers, status] of [
    [{ 'X-Test-Account': '' }, 401],
    [{ Origin: 'https://outsider.example' }, 403],
    [{ 'Content-Type': 'text/plain' }, 415],
  ])
    assert.equal((await f.open({ headers })).status, status);
  const deleted = await setup(t, { deleted: true });
  assert.equal((await deleted.open()).status, 401);
  assert.equal(f.state.writes + deleted.state.writes, 0);
});

test('unique-index race recovers the saved room', async (t) => {
  const f = await setup(t, { duplicate: true });
  const result = await f.open();
  assert.equal(result.status, 200);
  assert.equal(result.body.conversation.id, String(f.state.room._id));
  assert.equal(f.state.writes, 1);
});

for (const options of [
  { readFailure: true },
  { writeFailure: true },
  { nullResult: true },
  { duplicate: true, recoveryMissing: true },
  { duplicate: true, recoveryFailure: true },
]) {
  test(`storage failure is safe: ${JSON.stringify(options)}`, async (t) => {
    const f = await setup(t, options);
    const result = await f.open();
    assert.equal(result.status, 503);
    assert.equal(
      JSON.stringify([result, f.state.logs]).includes('private'),
      false,
    );
    assert.equal(f.state.logs.length, 1);
  });
}
