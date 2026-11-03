import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

const owner = new ObjectId();
const partner = new ObjectId();
const outsider = new ObjectId();
const roomId = new ObjectId();
const origin = 'http://localhost:5173';

function database(state, options) {
  return {
    collection(name) {
      if (name === 'users') return userStorage(state, options);
      assert.equal(name, 'conversations');
      return {
        async findOne(filter) {
          state.roomReads = (state.roomReads ?? 0) + 1;
          if (options.roomDisappears && state.roomReads > 1) return null;
          if (options.roomFailure) throw new Error('private room');
          if (
            options.missingRoom ||
            !filter._id.equals(roomId) ||
            ![owner, partner].some((id) => id.equals(filter.participantIds))
          )
            return null;
          return { _id: roomId, participantIds: [owner, partner] };
        },
      };
    },
  };
}

function userStorage(state, options) {
  return {
    async findOne(filter, settings) {
      if (settings.projection._id === 1)
        return options.deleted ? null : { _id: filter._id };
      assert.deepEqual(settings.projection, { socialBattery: 1 });
      state.reads.push(String(filter._id));
      if (options.readFailure) throw new Error('private battery');
      if (
        options.disappeared ||
        (options.partnerDeleted && filter._id.equals(partner))
      )
        return null;
      return {
        socialBattery: state.statuses[String(filter._id)],
        email: 'private@example.com',
      };
    },
    async findOneAndUpdate(filter, update, settings) {
      assert.deepEqual(filter, { _id: owner });
      assert.deepEqual(settings, {
        returnDocument: 'after',
        projection: { socialBattery: 1 },
      });
      assert.deepEqual(Object.keys(update), ['$set']);
      assert.deepEqual(Object.keys(update.$set), ['socialBattery']);
      if (options.writeFailure) throw new Error('private write');
      if (options.disappeared) return null;
      state.writes += 1;
      state.statuses[String(owner)] = update.$set.socialBattery;
      return { socialBattery: update.$set.socialBattery };
    },
  };
}

async function setup(t, options = {}) {
  const state = {
    statuses: { [partner]: options.partnerStatus },
    reads: [],
    writes: 0,
    logs: [],
  };
  const app = createApp(database(state, options), {
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
  async function request({
    path = '/api/users/me/social-battery',
    method = 'GET',
    body,
    headers,
  } = {}) {
    const response = await fetch(`${url}${path}`, {
      method,
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        'X-Test-Account': String(owner),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
      cache: response.headers.get('cache-control'),
    };
  }
  return { state, request };
}

const partnerPath = `/api/conversations/${roomId}/social-battery`;

test('existing account starts unset; each saved choice survives another read', async (t) => {
  const f = await setup(t);
  assert.deepEqual(await f.request(), {
    status: 200,
    body: { status: null },
    cache: 'no-store',
  });
  for (const status of ['open', 'busy', 'space', 'space']) {
    assert.equal(
      (await f.request({ method: 'PATCH', body: { status } })).body.status,
      status,
    );
    assert.equal((await f.request()).body.status, status);
  }
  assert.equal(f.state.writes, 4);
});

test('invalid choices and account-targeting fields never write', async (t) => {
  const f = await setup(t);
  for (const body of [
    null,
    [],
    {},
    { status: 'full' },
    { status: 1 },
    { status: null },
    { status: 'open', userId: String(partner) },
    { socialBattery: 'open' },
  ])
    assert.equal((await f.request({ method: 'PATCH', body })).status, 400);
  assert.equal(f.state.writes, 0);
});

test('session, verified account, origin and JSON guards protect writes', async (t) => {
  const f = await setup(t);
  for (const [headers, expected] of [
    [{ 'X-Test-Account': '' }, 401],
    [{ Origin: 'https://other.example' }, 403],
    [{ 'Content-Type': 'text/plain' }, 415],
  ])
    assert.equal(
      (await f.request({ method: 'PATCH', body: { status: 'open' }, headers }))
        .status,
      expected,
    );
  const deleted = await setup(t, { deleted: true });
  assert.equal((await deleted.request()).status, 401);
  assert.equal((await deleted.request({ path: partnerPath })).status, 401);
  assert.equal(f.state.writes, 0);
});

for (const status of ['open', 'busy', 'space', undefined, 'corrupt']) {
  test(`accepted room participant reads partner status safely: ${status}`, async (t) => {
    const f = await setup(t, { partnerStatus: status });
    const result = await f.request({ path: partnerPath });
    assert.deepEqual(result, {
      status: 200,
      body: {
        status: ['open', 'busy', 'space'].includes(status) ? status : null,
      },
      cache: 'no-store',
    });
    assert.deepEqual(f.state.reads, [String(partner)]);
    // Both participants can view their counterpart, never by arbitrary account ID.
    assert.equal(
      (
        await f.request({
          path: partnerPath,
          headers: { 'X-Test-Account': String(partner) },
        })
      ).status,
      200,
    );
    assert.equal(f.state.reads.at(-1), String(owner));
  });
}

test('outsider, nonexistent room and non-room invitation IDs expose no status', async (t) => {
  const f = await setup(t);
  const denied = await f.request({
    path: partnerPath,
    headers: { 'X-Test-Account': String(outsider) },
  });
  const missing = await f.request({
    path: `/api/conversations/${new ObjectId()}/social-battery`,
  });
  assert.equal(denied.status, 404);
  assert.deepEqual(denied, missing);
  assert.equal(
    (await f.request({ path: '/api/conversations/bad/social-battery' })).status,
    400,
  );
  assert.equal(
    (await f.request({ path: partnerPath, headers: { 'X-Test-Account': '' } }))
      .status,
    401,
  );
  assert.deepEqual(f.state.reads, []);
});

test('deleted partner shows Not set without exposing account fields', async (t) => {
  const f = await setup(t, { partnerDeleted: true });
  assert.deepEqual((await f.request({ path: partnerPath })).body, {
    status: null,
  });
});

for (const [options, request] of [
  [{ readFailure: true }, {}],
  [{ writeFailure: true }, { method: 'PATCH', body: { status: 'busy' } }],
  [{ readFailure: true }, { path: partnerPath }],
  [{ roomFailure: true }, { path: partnerPath }],
]) {
  test(`storage failure is safe: ${JSON.stringify(options)} ${request.path ?? 'self'}`, async (t) => {
    const f = await setup(t, options);
    const result = await f.request(request);
    assert.equal(result.status, 503);
    assert.equal(
      JSON.stringify([result, f.state.logs]).includes('private'),
      false,
    );
    assert.equal(f.state.logs.length, 1);
  });
}

test('account disappearance between guard and operation is unauthorized', async (t) => {
  const f = await setup(t, { disappeared: true });
  assert.equal((await f.request()).status, 401);
  assert.equal(
    (await f.request({ method: 'PATCH', body: { status: 'busy' } })).status,
    401,
  );
});

test('room removed between access check and status read returns no status', async (t) => {
  const f = await setup(t, { roomDisappears: true });
  assert.equal((await f.request({ path: partnerPath })).status, 404);
  assert.deepEqual(f.state.reads, []);
});
