import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import {
  parseInvitationQuery,
  invitationCursor,
} from '../src/invitation-pagination.js';
import { startTestServer } from '../test-support/server.js';

const account = new ObjectId();
const other = new ObjectId();
function invitation(number, incoming = true) {
  return {
    _id: new ObjectId(number.toString(16).padStart(24, '0')),
    senderId: incoming ? other : account,
    recipientId: incoming ? account : other,
    message: 'Private message',
    status: ['pending', 'deferred', 'accepted', 'declined'][number % 4],
    createdAt: new Date('2026-10-29T12:00:00.000Z'),
    updatedAt: new Date('2026-10-29T12:00:00.000Z'),
    respondedAt: null,
    pairKey: 'internal',
  };
}

function cursor(records, filter, options, queries) {
  queries.push({ filter, options });
  let maximum;
  return {
    sort(order) {
      assert.deepEqual(order, { createdAt: -1, _id: -1 });
      return this;
    },
    limit(value) {
      maximum = value;
      return this;
    },
    async toArray() {
      const participant = filter.recipientId ? 'recipientId' : 'senderId';
      assert.ok(filter[participant].equals(account));
      return records
        .filter((r) => r[participant].equals(account))
        .filter(
          (r) =>
            !filter.$or ||
            r.createdAt < filter.$or[0].createdAt.$lt ||
            (+r.createdAt === +filter.$or[1].createdAt &&
              r._id.toHexString() < filter.$or[1]._id.$lt.toHexString()),
        )
        .sort(
          (a, b) =>
            +b.createdAt - +a.createdAt ||
            b._id.toHexString().localeCompare(a._id.toHexString()),
        )
        .slice(0, maximum);
    },
  };
}

async function setup(t, records = [], failure = false) {
  const queries = [];
  const logs = [];
  const db = {
    collection(name) {
      if (name === 'users') return { findOne: async () => ({ _id: account }) };
      assert.equal(name, 'invitations');
      return {
        find(filter, options) {
          if (failure) throw new Error('Private message and database details');
          return cursor(records, filter, options, queries);
        },
      };
    },
  };
  const app = createApp(db, {
    requestProtection: createRequestProtection({
      APP_ORIGIN: 'http://localhost:5173',
    }),
    sessionMiddleware(req, _res, next) {
      req.session = { userId: req.get('X-Test-Account') };
      next();
    },
  });
  app.locals.logger = { error: (...args) => logs.push(args) };
  const url = await startTestServer(t, app);
  return {
    queries,
    logs,
    get(query, authenticated = true) {
      return fetch(`${url}/api/invitations?${query}`, {
        headers: authenticated
          ? { 'X-Test-Account': account.toHexString() }
          : {},
      });
    },
  };
}

test('pagination rejects invalid, unknown, repeated and malformed query values', () => {
  for (const query of [
    {},
    { direction: 'all' },
    { direction: ['incoming', 'outgoing'] },
    { direction: 'incoming', userId: other.toHexString() },
    ...['0', '51', '-1', '1.5', '01', '', '1e1'].map((limit) => ({
      direction: 'incoming',
      limit,
    })),
    ...['bad', '', '2026-02-30T12:00:00.000Z~' + 'a'.repeat(24), ['value']].map(
      (cursor) => ({ direction: 'incoming', cursor }),
    ),
  ])
    assert.equal(parseInvitationQuery(query), null);
  assert.equal(parseInvitationQuery({ direction: 'incoming' }).pageSize, 20);
  assert.equal(
    parseInvitationQuery({ direction: 'outgoing', limit: '50' }).pageSize,
    50,
  );
});

test('lists isolate direction and participants and omit internal fields', async (t) => {
  const unrelated = { ...invitation(9), recipientId: other, senderId: other };
  const f = await setup(t, [invitation(1), invitation(2, false), unrelated]);
  for (const [direction, expected] of [
    ['incoming', 1],
    ['outgoing', 2],
  ]) {
    const result = await f.get(`direction=${direction}`);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    const body = await result.json();
    assert.deepEqual(
      body.invitations.map((r) => r.id),
      [invitation(expected)._id.toHexString()],
    );
    assert.equal(body.nextCursor, null);
    assert.doesNotMatch(JSON.stringify(body), /pairKey|email|password/);
  }
  assert.equal(f.queries[0].options.projection.pairKey, undefined);
});

test('cursor pages handle equal timestamps and new arrivals without repeating records', async (t) => {
  const records = [1, 2, 3, 4].map((n) => invitation(n));
  const f = await setup(t, records);
  const first = await (await f.get('direction=incoming&limit=2')).json();
  assert.deepEqual(
    first.invitations.map((r) => r.id),
    [4, 3].map((n) => invitation(n)._id.toHexString()),
  );
  assert.equal(first.nextCursor, invitationCursor(invitation(3)));
  records.push({
    ...invitation(5),
    createdAt: new Date('2026-10-30T12:00:00.000Z'),
  });
  const second = await (
    await f.get(
      `direction=incoming&limit=2&cursor=${encodeURIComponent(first.nextCursor)}`,
    )
  ).json();
  assert.deepEqual(
    second.invitations.map((r) => r.id),
    [2, 1].map((n) => invitation(n)._id.toHexString()),
  );
  assert.equal(second.nextCursor, null);
});

test('lists return empty results, enforce authentication and reject invalid queries', async (t) => {
  const f = await setup(t);
  const empty = await f.get('direction=incoming');
  assert.deepEqual(await empty.json(), { invitations: [], nextCursor: null });
  const anonymous = await f.get('direction=incoming', false);
  assert.equal(anonymous.status, 401);
  await anonymous.arrayBuffer();
  for (const query of [
    'direction=incoming&direction=outgoing',
    'direction=incoming&limit=51',
    'direction=incoming&senderId=spoof',
  ]) {
    const result = await f.get(query);
    assert.equal(result.status, 400);
    await result.arrayBuffer();
  }
  assert.equal(f.queries.length, 1);
});

test('list failures return safe errors and omit private content from logs', async (t) => {
  const f = await setup(t, [], true);
  const result = await f.get('direction=outgoing');
  assert.equal(result.status, 503);
  assert.doesNotMatch(
    JSON.stringify([await result.json(), f.logs]),
    /Private message|database details/,
  );
  assert.equal(f.logs[0][1].operation, 'invitation-list');
});

test('cursor crosses older dates even when older records have higher IDs', async (t) => {
  const records = [
    invitation(1),
    { ...invitation(9), createdAt: new Date('2026-10-28T12:00:00.000Z') },
    { ...invitation(8), createdAt: new Date('2026-10-27T12:00:00.000Z') },
  ];
  const f = await setup(t, records);
  const ids = [];
  let nextCursor = null;
  for (let page = 0; page < 3; page += 1) {
    const suffix = nextCursor
      ? `&cursor=${encodeURIComponent(nextCursor)}`
      : '';
    const result = await f.get(`direction=incoming&limit=1${suffix}`);
    assert.equal(result.status, 200);
    const body = await result.json();
    ids.push(...body.invitations.map((r) => r.id));
    nextCursor = body.nextCursor;
    if (page < 2) assert.equal(typeof nextCursor, 'string');
  }
  assert.deepEqual(
    ids,
    records.map((r) => r._id.toHexString()),
  );
  assert.equal(new Set(ids).size, 3);
  assert.equal(nextCursor, null);
});
