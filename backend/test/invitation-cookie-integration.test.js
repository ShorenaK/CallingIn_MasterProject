import { messageStorage } from '../test-support/messages.js';
import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { EventEmitter } from 'node:events';
import { ObjectId } from 'mongodb';
import { startBackend } from '../src/lifecycle.js';
import { hashPassword } from '../src/password.js';

const origin = 'http://127.0.0.1:5173';
const password = 'Public cookie integration test password';
let users;
before(async () => {
  const passwordHash = await hashPassword(password);
  users = ['sender', 'recipient', 'outsider'].map((name) => ({
    _id: new ObjectId(),
    displayName: name,
    email: `${name}@example.com`,
    passwordHash,
  }));
});

function sessionStorage() {
  const sessions = new Map();
  return {
    createIndex: async () => {},
    async findOne(filter) {
      const value = sessions.get(filter._id);
      return value && value.expires > filter.$or[1].expires.$gt ? value : null;
    },
    async updateOne(filter, update) {
      const exists = sessions.has(filter._id);
      sessions.set(filter._id, { ...sessions.get(filter._id), ...update.$set });
      return { matchedCount: exists ? 1 : 0, upsertedCount: exists ? 0 : 1 };
    },
    async deleteOne(filter) {
      return { deletedCount: Number(sessions.delete(filter._id)) };
    },
  };
}

function invitationStorage() {
  const invitations = new Map();
  function matches(record, filter) {
    return (
      (!filter._id || record._id.equals(filter._id)) &&
      (!filter.recipientId || record.recipientId.equals(filter.recipientId)) &&
      (!filter.senderId || record.senderId.equals(filter.senderId)) &&
      (!filter.$or || filter.$or.some((entry) => matches(record, entry)))
    );
  }
  return {
    listIndexes: () => ({ toArray: async () => [] }),
    createIndex: async () => {},
    async insertOne(record) {
      if ([...invitations.values()].some((r) => r.pairKey === record.pairKey))
        throw Object.assign(new Error('simulated duplicate'), { code: 11000 });
      invitations.set(record._id.toHexString(), { ...record });
      return { insertedId: record._id };
    },
    async findOneAndUpdate(filter, update) {
      const record = invitations.get(filter._id.toHexString());
      if (
        !record ||
        !matches(record, filter) ||
        !filter.status.$in.includes(record.status)
      )
        return null;
      Object.assign(record, update.$set);
      return { ...record };
    },
    async findOne(filter) {
      const record = invitations.get(filter._id.toHexString());
      return record && matches(record, filter) ? { ...record } : null;
    },
    find(filter) {
      let limit;
      return {
        sort() {
          return this;
        },
        limit(value) {
          limit = value;
          return this;
        },
        async toArray() {
          return [...invitations.values()]
            .filter((r) => matches(r, filter))
            .slice(0, limit);
        },
      };
    },
  };
}

function conversationStorage() {
  const rooms = new Map();
  return {
    async findOne(filter) {
      return (
        [...rooms.values()].find(
          (room) =>
            room._id.equals(filter._id) &&
            room.participantIds.some((id) => id.equals(filter.participantIds)),
        ) ?? null
      );
    },
    createIndex: async () => {},
    async findOneAndUpdate(filter, update, settings) {
      assert.deepEqual(settings, { upsert: true, returnDocument: 'after' });
      const key = filter.invitationId.toHexString();
      if (!rooms.has(key))
        rooms.set(key, {
          _id: new ObjectId(),
          invitationId: filter.invitationId,
          ...update.$setOnInsert,
        });
      return rooms.get(key);
    },
  };
}

async function setup(t) {
  const collections = {
    conversations: conversationStorage(),
    messages: messageStorage({ messages: [] }),
    sessions: sessionStorage(),
    invitations: invitationStorage(),
    users: {
      createIndex: async () => {},
      find: (filter) => ({
        toArray: async () =>
          users.filter((u) => filter._id.$in.some((id) => id.equals(u._id))),
      }),
      findOne: async (filter) =>
        users.find((u) =>
          filter.email ? u.email === filter.email : u._id.equals(filter._id),
        ) ?? null,
    },
  };
  const db = {
    databaseName: 'invitation_cookie_test',
    listCollections: () => ({ next: async () => null }),
    createCollection: async () => {},
    collection: (name) => collections[name],
  };
  db.client = { db: () => db };
  const running = await startBackend({
    port: 0,
    connect: async () => ({ db, close: async () => {} }),
    env: {
      APP_ORIGIN: origin,
      SESSION_SECRET: 'public-cookie-test-secret-at-least-32-bytes',
    },
    runtime: new EventEmitter(),
    logger: { log() {} },
  });
  t.after(running.stop);
  const url = `http://127.0.0.1:${running.server.address().port}`;
  return async function request(method, path, body, cookie) {
    return fetch(`${url}${path}`, {
      method,
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  };
}

async function signIn(request, email) {
  const result = await request('POST', '/api/auth/login', { email, password });
  assert.equal(result.status, 200);
  await result.arrayBuffer();
  const cookie = result.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  return cookie.split(';')[0];
}

async function assertIsolation(request, cookie, invitationId) {
  const list = await request(
    'GET',
    '/api/invitations?direction=incoming',
    undefined,
    cookie,
  );
  assert.deepEqual(await list.json(), { invitations: [], nextCursor: null });
  const response = await request(
    'PATCH',
    `/api/invitations/${invitationId}/response`,
    { status: 'accepted' },
    cookie,
  );
  assert.equal(response.status, 404);
  await response.arrayBuffer();
}

async function respond(request, cookie, id, status) {
  const result = await request(
    'PATCH',
    `/api/invitations/${id}/response`,
    { status },
    cookie,
  );
  assert.equal(result.status, 200);
  return (await result.json()).invitation;
}

async function createThroughLookup(request, cookie) {
  const lookup = await request(
    'POST',
    '/api/users/lookup',
    { email: 'recipient@example.com' },
    cookie,
  );
  assert.equal(lookup.status, 200);
  const { user } = await lookup.json();
  assert.deepEqual(user, {
    id: users[1]._id.toHexString(),
    displayName: 'recipient',
  });
  const created = await request(
    'POST',
    '/api/invitations',
    { recipientId: user.id, message: 'Please connect when ready.' },
    cookie,
  );
  assert.equal(created.status, 201);
  return (await created.json()).invitation;
}

async function assertLoggedOut(request, recipientCookie, invitationId) {
  for (const [method, path, body] of [
    ['GET', '/api/invitations?direction=incoming', undefined],
    ['POST', `/api/invitations/${invitationId}/conversation`, {}],
    ['POST', '/api/users/lookup', { email: users[0].email }],
    [
      'POST',
      '/api/invitations',
      { recipientId: users[0]._id.toHexString(), message: 'Replay' },
    ],
    [
      'PATCH',
      `/api/invitations/${invitationId}/response`,
      { status: 'declined' },
    ],
  ]) {
    const replay = await request(method, path, body, recipientCookie);
    assert.equal(replay.status, 401);
    await replay.arrayBuffer();
  }
}

test('real cookie sessions connect login, lookup, creation, lists, responses and logout', async (t) => {
  // Real startup, Express, session middleware and connect-mongo; database methods
  // are simulated. This does not verify actual MongoDB validation or atomicity.
  const request = await setup(t);
  const senderCookie = await signIn(request, users[0].email);
  const recipientCookie = await signIn(request, users[1].email);
  const outsiderCookie = await signIn(request, users[2].email);
  const invitation = await createThroughLookup(request, senderCookie);
  for (const [cookie, direction] of [
    [senderCookie, 'outgoing'],
    [recipientCookie, 'incoming'],
  ]) {
    const result = await request(
      'GET',
      `/api/invitations?direction=${direction}`,
      undefined,
      cookie,
    );
    assert.equal(result.status, 200);
    assert.deepEqual((await result.json()).invitations, [
      {
        ...invitation,
        otherPerson: {
          displayName: direction === 'outgoing' ? 'recipient' : 'sender',
        },
      },
    ]);
  }
  await assertIsolation(request, outsiderCookie, invitation.id);
  const senderResponse = await request(
    'PATCH',
    `/api/invitations/${invitation.id}/response`,
    { status: 'accepted' },
    senderCookie,
  );
  assert.equal(senderResponse.status, 404);
  await senderResponse.arrayBuffer();
  assert.equal(
    (await respond(request, recipientCookie, invitation.id, 'deferred')).status,
    'deferred',
  );
  const accepted = await respond(
    request,
    recipientCookie,
    invitation.id,
    'accepted',
  );
  assert.equal(accepted.status, 'accepted');
  assert.deepEqual(
    await respond(request, recipientCookie, invitation.id, 'accepted'),
    accepted,
  );
  const logout = await request('POST', '/api/auth/logout', {}, recipientCookie);
  assert.equal(logout.status, 204);
  await assertLoggedOut(request, recipientCookie, invitation.id);
});

test('cookie-authenticated acceptance opens one shared room and excludes outsiders', async (t) => {
  const request = await setup(t);
  const senderCookie = await signIn(request, users[0].email);
  const recipientCookie = await signIn(request, users[1].email);
  const outsiderCookie = await signIn(request, users[2].email);
  const invitation = await createThroughLookup(request, senderCookie);
  const path = `/api/invitations/${invitation.id}/conversation`;
  const pending = await request('POST', path, {}, senderCookie);
  assert.equal(pending.status, 409);
  await pending.arrayBuffer();
  await respond(request, recipientCookie, invitation.id, 'accepted');
  const first = await request('POST', path, {}, recipientCookie);
  assert.equal(first.status, 200);
  const room = await first.json();
  assert.deepEqual(
    room.conversation.participantIds,
    users.slice(0, 2).map((u) => String(u._id)),
  );
  assert.equal(room.conversation.invitationId, invitation.id);
  const retry = await request('POST', path, {}, senderCookie);
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), room);
  for (const cookie of [outsiderCookie, undefined]) {
    const rejected = await request('POST', path, {}, cookie);
    assert.equal(rejected.status, cookie ? 404 : 401);
    await rejected.arrayBuffer();
  }
  const logout = await request('POST', '/api/auth/logout', {}, recipientCookie);
  assert.equal(logout.status, 204);
  const replay = await request('POST', path, {}, recipientCookie);
  assert.equal(replay.status, 401);
  await replay.arrayBuffer();
});

test('real cookie sessions connect invitation acceptance to private message sending and reading', async (t) => {
  const request = await setup(t);
  const senderCookie = await signIn(request, users[0].email);
  const recipientCookie = await signIn(request, users[1].email);
  const outsiderCookie = await signIn(request, users[2].email);
  const invitation = await createThroughLookup(request, senderCookie);
  await respond(request, recipientCookie, invitation.id, 'accepted');
  const opened = await request(
    'POST',
    `/api/invitations/${invitation.id}/conversation`,
    {},
    senderCookie,
  );
  assert.equal(opened.status, 200);
  const { conversation } = await opened.json();
  const path = `/api/conversations/${conversation.id}/messages`;
  for (const cookie of [senderCookie, recipientCookie]) {
    const sent = await request('POST', path, { text: 'Hello there' }, cookie);
    assert.equal(sent.status, 201);
    assert.equal((await sent.json()).message.text, 'Hello there');
  }
  const history = await request('GET', path, undefined, recipientCookie);
  assert.equal(history.status, 200);
  assert.equal((await history.json()).messages.length, 2);
  for (const method of ['GET', 'POST']) {
    const denied = await request(
      method,
      path,
      method === 'POST' ? { text: 'intrusion' } : undefined,
      outsiderCookie,
    );
    assert.equal(denied.status, 404);
    await denied.arrayBuffer();
  }
  const logout = await request('POST', '/api/auth/logout', {}, recipientCookie);
  assert.equal(logout.status, 204);
  for (const method of ['GET', 'POST']) {
    const replay = await request(
      method,
      path,
      method === 'POST' ? { text: 'replay' } : undefined,
      recipientCookie,
    );
    assert.equal(replay.status, 401);
    await replay.arrayBuffer();
  }
});
