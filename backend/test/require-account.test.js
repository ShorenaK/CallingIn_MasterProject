import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { requireAccount } from '../src/require-account.js';
import { createApp } from '../src/app.js';
import { createRequestProtection } from '../src/request-protection.js';
import { startTestServer } from '../test-support/server.js';

function captureResponse() {
  return {
    locals: { accountId: 'unverified' },
    set(name, value) {
      this[name] = value;
      return this;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    clearCookie(name, options) {
      this.cleared = { name, options };
    },
  };
}

function fixture(options = {}) {
  const calls = [];
  const id = new ObjectId();
  const request = {
    session: {
      userId: id.toHexString(),
      destroy(done) {
        calls.push('destroy');
        done(options.destroyFailure ? new Error('private session') : undefined);
      },
    },
    app: {
      locals: {
        logger: { error: (...args) => calls.push(args) },
        db: {
          collection(name) {
            assert.equal(name, 'users');
            return {
              async findOne(filter, projection) {
                calls.push({ filter, projection });
                if (options.lookupFailure) throw new Error('private database');
                return options.missing ? null : { _id: id };
              },
            };
          },
        },
      },
    },
  };
  const response = captureResponse();
  let nextCalls = 0;
  return {
    request,
    response,
    calls,
    id,
    async run() {
      await requireAccount(request, response, () => {
        nextCalls += 1;
      });
      assert.equal(response['Cache-Control'], 'no-store');
      return nextCalls;
    },
  };
}

test('account guard rejects absent and malformed identities without querying storage', async () => {
  for (const userId of [undefined, '', 'invalid', 123, {}, 'a'.repeat(25)]) {
    const f = fixture();
    f.request.session.userId = userId;
    assert.equal(await f.run(), 0);
    assert.equal(f.response.code, 401);
    assert.equal(f.response.locals.accountId, undefined);
    assert.deepEqual(f.calls, []);
  }
  const f = fixture();
  delete f.request.session;
  assert.equal(await f.run(), 0);
  assert.equal(f.response.code, 401);
});

test('account guard passes only verified identity and requests no private fields', async () => {
  const f = fixture();
  assert.equal(await f.run(), 1);
  assert.deepEqual(f.response.locals.accountId, f.id);
  assert.deepEqual(f.calls, [
    {
      filter: { _id: f.id },
      projection: { projection: { _id: 1 } },
    },
  ]);
});

test('deleted account loses authorization and its session cookie', async () => {
  const f = fixture({ missing: true });
  assert.equal(await f.run(), 0);
  assert.equal(f.response.code, 401);
  assert.equal(f.request.session.userId, undefined);
  assert.equal(f.calls[1], 'destroy');
  assert.deepEqual(f.response.cleared, {
    name: 'callingin.sid',
    options: { path: '/' },
  });
});

test('storage and destruction failures fail closed without leaking details', async () => {
  for (const options of [
    { lookupFailure: true },
    { missing: true, destroyFailure: true },
    { noDatabase: true },
  ]) {
    const f = fixture(options);
    if (options.noDatabase) delete f.request.app.locals.db;
    assert.equal(await f.run(), 0);
    assert.equal(f.response.code, 503);
    assert.equal(f.response.locals.accountId, undefined);
    assert.doesNotMatch(JSON.stringify([f.response.body, f.calls]), /private/);
    if (options.destroyFailure)
      assert.equal(f.request.session.userId, undefined);
  }
});

for (const path of ['/api/users/lookup', '/api/invitations']) {
  test(`${path} protects writes before parsing or accessing sessions`, async (t) => {
    let sessionCalls = 0;
    const app = createApp(undefined, {
      requestProtection: createRequestProtection({
        APP_ORIGIN: 'http://localhost:5173',
      }),
      sessionMiddleware(_req, _res, next) {
        sessionCalls += 1;
        next();
      },
    });
    const url = await startTestServer(t, app);
    const rejected = await fetch(`${url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    assert.equal(rejected.status, 403);
    assert.equal(sessionCalls, 0);
    const wrongType = await fetch(`${url}${path}`, {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173' },
      body: 'text',
    });
    assert.equal(wrongType.status, 415);
    assert.equal(sessionCalls, 0);
    const unauthorized = await fetch(`${url}${path}`);
    assert.equal(unauthorized.status, 401);
    assert.equal(sessionCalls, 1);
  });
}
