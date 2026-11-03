import {
  invisibleMessages,
  contentMessages,
} from '../test-support/message-content.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';
import { messageStorage } from '../test-support/messages.js';

const sender = new ObjectId();
const recipient = new ObjectId();
const roomId = new ObjectId();
const otherRoom = new ObjectId();
const origin = 'http://localhost:5173';

function database(state, options) {
  return {
    collection(name) {
      if (name === 'users')
        return { findOne: async () => (options.deleted ? null : {}) };
      if (name === 'messages') return messageStorage(state, options);
      assert.equal(name, 'conversations');
      return {
        findOne: async (filter, settings) => {
          state.accesses += 1;
          assert.deepEqual(settings, { projection: { _id: 1 } });
          if (options.accessFailure)
            throw new Error('private conversation failure');
          return !options.missing &&
            [roomId, otherRoom].some((id) => id.equals(filter._id)) &&
            [sender, recipient].some((id) => id.equals(filter.participantIds))
            ? { _id: filter._id }
            : null;
        },
      };
    },
  };
}

async function setup(t, options = {}) {
  const state = { messages: [], logs: [], accesses: 0, queries: [] };
  const app = createApp(database(state, options), {
    requestProtection: createRequestProtection({ APP_ORIGIN: origin }),
    sessionMiddleware(req, _res, next) {
      req.session = {
        userId: req.get('X-Test-Account'),
        destroy: (done) => done(),
      };
      next();
    },
  });
  app.locals.logger = { error: (...args) => state.logs.push(args) };
  const url = await startTestServer(t, app);
  return {
    state,
    async request(method, input = {}) {
      const result = await fetch(
        `${url}/api/conversations/${input.id ?? roomId}/messages${input.query ?? ''}`,
        {
          method,
          headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            'X-Test-Account': String(input.account ?? sender),
            ...input.headers,
          },
          ...(method === 'POST'
            ? {
                body:
                  input.raw ?? JSON.stringify(input.body ?? { text: 'Hello' }),
              }
            : {}),
        },
      );
      return {
        status: result.status,
        body: await result.json(),
        headers: result.headers,
      };
    },
  };
}

function seed(state, count = 55, id = roomId) {
  for (let index = 0; index < count; index += 1)
    state.messages.push({
      _id: new ObjectId((index + 1).toString(16).padStart(24, '0')),
      conversationId: id,
      senderId: sender,
      text: String(index),
      createdAt: new Date('2026-11-02T12:00:00.000Z'),
    });
}

test('both participants send trimmed text and read each other’s messages', async (t) => {
  const f = await setup(t);
  for (const account of [sender, recipient]) {
    const sent = await f.request('POST', {
      account,
      body: { text: '  Hello\nfriend  ' },
    });
    assert.equal(sent.status, 201);
    assert.equal(sent.headers.get('cache-control'), 'no-store');
    assert.equal(sent.body.message.text, 'Hello\nfriend');
    assert.equal(sent.body.message.senderId, String(account));
    assert.equal(sent.body.message.conversationId, String(roomId));
    assert.equal(
      Number.isFinite(Date.parse(sent.body.message.createdAt)),
      true,
    );
    assert.match(sent.body.message.id, /^[a-f0-9]{24}$/);
  }
  const history = await f.request('GET', { account: recipient });
  assert.equal(history.status, 200);
  assert.equal(history.headers.get('cache-control'), 'no-store');
  assert.equal(history.body.messages.length, 2);
  assert.deepEqual(
    new Set(history.body.messages.map((m) => m.senderId)),
    new Set([String(sender), String(recipient)]),
  );
  assert.equal(history.body.nextCursor, null);
});

test('5000 UTF-16 units pass; empty, nontext and 5001-unit messages fail', async (t) => {
  const f = await setup(t);
  for (const text of ['x'.repeat(5000), '😀'.repeat(2500), '  ok  ']) {
    assert.equal((await f.request('POST', { body: { text } })).status, 201);
  }
  for (const body of [
    {},
    [],
    { text: '' },
    { text: ' \n\t ' },
    { text: 1 },
    { text: 'x'.repeat(5001) },
    { text: '😀'.repeat(2500) + 'x' },
    { text: 'hi', senderId: String(recipient) },
    { text: 'hi', createdAt: new Date() },
    { text: 'hi', conversationId: String(otherRoom) },
  ]) {
    assert.equal((await f.request('POST', { body })).status, 400);
  }
  assert.equal(f.state.messages.length, 3);
});

test('JSON body size, malformed JSON and media type protections apply', async (t) => {
  const f = await setup(t);
  for (const [input, status] of [
    [{ raw: '{' }, 400],
    [{ body: { text: 'x'.repeat(17000) } }, 413],
    [{ raw: JSON.stringify({ text: '\u0001'.repeat(5000) }) }, 413],
    [{ headers: { 'Content-Type': 'text/plain' } }, 415],
    [{ headers: { Origin: 'https://outsider.example' } }, 403],
  ])
    assert.equal((await f.request('POST', input)).status, status);
  assert.equal(f.state.messages.length, 0);
});

for (const method of ['GET', 'POST']) {
  test(`${method} rejects outsiders, missing rooms, invalid IDs and absent sessions`, async (t) => {
    const f = await setup(t);
    const outsider = await f.request(method, { account: new ObjectId() });
    const missing = await f.request(method, { id: String(new ObjectId()) });
    assert.equal(outsider.status, 404);
    assert.equal(missing.status, 404);
    assert.deepEqual(outsider.body, missing.body);
    assert.equal((await f.request(method, { id: 'bad' })).status, 400);
    assert.equal(
      (await f.request(method, { headers: { 'X-Test-Account': '' } })).status,
      401,
    );
    const deleted = await setup(t, { deleted: true });
    assert.equal((await deleted.request(method)).status, 401);
    assert.equal(f.state.messages.length, 0);
    assert.equal(f.state.queries.length, 0);
  });
}

test('history pagination handles equal timestamps and concurrent new messages without mixing rooms', async (t) => {
  const f = await setup(t);
  seed(f.state);
  seed(f.state, 1, otherRoom);
  let page = await f.request('GET');
  assert.equal(page.body.messages.length, 20);
  assert.equal(f.state.pageLimit, 21);
  const all = [...page.body.messages];
  const inserted = await f.request('POST', { body: { text: 'newer' } });
  assert.equal(inserted.status, 201);
  while (page.body.nextCursor) {
    page = await f.request('GET', {
      query: `?cursor=${encodeURIComponent(page.body.nextCursor)}`,
    });
    assert.equal(page.status, 200);
    all.push(...page.body.messages);
  }
  assert.deepEqual(
    all.map((message) => message.text),
    Array.from({ length: 55 }, (_, i) => String(54 - i)),
  );
  assert.equal(new Set(all.map((message) => message.id)).size, 55);
  assert.equal(
    all.some((message) => message.id === inserted.body.message.id),
    false,
  );
  assert.equal(
    all.every((message) => message.conversationId === String(roomId)),
    true,
  );
});

test('limits, empty history and forged cursors remain scoped to the authorized room', async (t) => {
  const f = await setup(t);
  assert.deepEqual((await f.request('GET')).body, {
    messages: [],
    nextCursor: null,
  });
  seed(f.state);
  const maximum = await f.request('GET', { query: '?limit=50' });
  assert.equal(maximum.body.messages.length, 50);
  const cursor = maximum.body.nextCursor;
  const other = await f.request('GET', {
    id: String(otherRoom),
    query: `?cursor=${encodeURIComponent(cursor)}&limit=1`,
  });
  assert.equal(other.status, 200);
  assert.equal(other.body.messages.length, 0);
  assert.equal(
    (await f.request('GET', { query: '?limit=1' })).body.messages.length,
    1,
  );
});

test('invalid or repeated query parameters are rejected', async (t) => {
  const f = await setup(t);
  for (const query of [
    '?limit=0',
    '?limit=51',
    '?limit=01',
    '?limit=x',
    '?limit=1&limit=2',
    '?cursor=bad',
    '?cursor=x&cursor=y',
    '?senderId=x',
    '?direction=incoming',
    '?cursor=2026-02-30T12:00:00.000Z~000000000000000000000001',
    '?cursor=2026-11-02T12:00:00.000Z~zzzzzzzzzzzzzzzzzzzzzzzz',
  ]) {
    assert.equal((await f.request('GET', { query })).status, 400);
  }
  assert.equal(f.state.queries.length, 0);
});

test('60 attempts per account per minute are shared across rooms; reads and other accounts remain available', async (t) => {
  const f = await setup(t);
  for (let index = 0; index < 60; index += 1) {
    const result = await f.request('POST', {
      id: String(index % 2 ? otherRoom : roomId),
      body: { text: '' },
    });
    assert.equal(result.status, 400);
  }
  const limited = await f.request('POST');
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get('retry-after'));
  assert.equal((await f.request('POST', { account: recipient })).status, 201);
  assert.equal((await f.request('GET')).status, 200);
});

for (const [options, method] of [
  [{ accessFailure: true }, 'GET'],
  [{ accessFailure: true }, 'POST'],
  [{ writeFailure: true }, 'POST'],
  [{ listFailure: true }, 'GET'],
]) {
  test(`safe failure ${method} ${JSON.stringify(options)}`, async (t) => {
    const f = await setup(t, options);
    const result = await f.request(method);
    assert.equal(result.status, 503);
    assert.equal(f.state.logs.length, 1);
    assert.equal(
      JSON.stringify([result.body, f.state.logs]).includes('private'),
      false,
    );
  });
}

test('history uses timestamps before IDs and returns older timestamps after the cursor', async (t) => {
  const f = await setup(t);
  seed(f.state, 3);
  f.state.messages[0].createdAt = new Date('2026-11-03T12:00:00.000Z');
  f.state.messages[2].createdAt = new Date('2026-11-01T12:00:00.000Z');
  const first = await f.request('GET', { query: '?limit=1' });
  assert.deepEqual(
    first.body.messages.map((m) => m.text),
    ['0'],
  );
  const next = await f.request('GET', {
    query: `?cursor=${encodeURIComponent(first.body.nextCursor)}`,
  });
  assert.deepEqual(
    next.body.messages.map((m) => m.text),
    ['1', '2'],
  );
  assert.equal(next.body.nextCursor, null);
});

test('invisible-only replies are rejected before storage, including direct API requests', async (t) => {
  const f = await setup(t);
  for (const text of invisibleMessages) {
    const result = await f.request('POST', { body: { text } });
    assert.equal(result.status, 400, JSON.stringify(text));
    assert.match(result.body.error, /visible content/);
  }
  assert.equal(f.state.messages.length, 0);
});

test('multilingual replies and emoji preserve their joiners, selectors and content', async (t) => {
  const f = await setup(t);
  for (const text of contentMessages) {
    const result = await f.request('POST', { body: { text } });
    assert.equal(result.status, 201, JSON.stringify(text));
    assert.equal(result.body.message.text, text.trim());
    assert.equal(f.state.messages.at(-1).text, text.trim());
  }
});
