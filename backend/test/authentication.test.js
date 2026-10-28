import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { ObjectId } from 'mongodb';
import {
  login,
  logout,
  currentUser,
  updateProfile,
} from '../src/authentication.js';
import { hashPassword } from '../src/registration.js';

const password = 'Public test password for authentication';
let account;
before(async () => {
  account = {
    _id: new ObjectId(),
    displayName: 'Test Person',
    email: 'test@example.com',
    passwordHash: await hashPassword(password),
  };
});

// Capture responses without opening a network port. These are handler tests;
// middleware integration and real MongoDB persistence require separate tests.
function response() {
  return {
    code: 200,
    headers: {},
    set(name, value) {
      this.headers[name] = value;
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
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

function profileUpdateStub(options, events) {
  return async (filter, update, updateOptions) => {
    events.push({ filter, update, options: updateOptions });
    if (options.failure === 'update')
      throw new Error('private database detail');
    return options.missing ? null : { ...account, ...update.$set };
  };
}

function fixture(options = {}) {
  const events = [];
  const request = {
    body: { email: ' TEST@example.com ', password },
    app: {
      locals: {
        db: {
          collection(name) {
            assert.equal(name, 'users');
            return {
              findOneAndUpdate: profileUpdateStub(options, events),
              async findOne(filter, projection) {
                events.push({ filter, projection });
                if (options.failure === 'lookup')
                  throw new Error('private database detail');
                return options.missing ? null : account;
              },
            };
          },
        },
      },
    },
  };
  function makeSession() {
    return {
      cookie: {},
      regenerate(done) {
        events.push('regenerate');
        if (options.failure === 'regenerate')
          return done(new Error('private session detail'));
        request.session = makeSession();
        done();
      },
      save(done) {
        events.push('save');
        done(
          options.failure === 'save'
            ? new Error('private save detail')
            : undefined,
        );
      },
      destroy(done) {
        events.push('destroy');
        delete request.session;
        done(
          options.failure === 'destroy'
            ? new Error('private destroy detail')
            : undefined,
        );
      },
    };
  }
  request.session = makeSession();
  return { request, result: response(), events };
}

function assertSafe(result, code) {
  assert.equal(result.code, code);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.doesNotMatch(
    JSON.stringify(result.body) ?? '',
    /passwordHash|private .*detail/,
  );
}

for (const remember of [true, false, undefined]) {
  test(`login regenerates and saves session with keepSignedIn=${remember}`, async () => {
    const { request, result, events } = fixture();
    request.body.keepSignedIn = remember;
    const oldSession = request.session;
    await login(request, result);
    assertSafe(result, 200);
    assert.notEqual(request.session, oldSession);
    assert.equal(oldSession.userId, undefined);
    assert.equal(request.session.userId, account._id.toHexString());
    assert.equal(
      request.session.cookie.maxAge,
      remember ? 90 * 86400000 : undefined,
    );
    assert.deepEqual(events, [
      { filter: { email: account.email }, projection: undefined },
      'regenerate',
      'save',
    ]);
    assert.deepEqual(result.body.user, {
      id: account._id.toHexString(),
      displayName: account.displayName,
      email: account.email,
    });
  });
}

test('invalid input is rejected before account lookup or session changes', async () => {
  for (const body of [
    null,
    {},
    [],
    { email: 'bad', password },
    { email: account.email, password: 'short' },
    { email: account.email, password, keepSignedIn: 'true' },
  ]) {
    const { request, result, events } = fixture();
    request.body = body;
    await login(request, result);
    assertSafe(result, 400);
    assert.deepEqual(events, []);
  }
});

test('unknown account and wrong password return identical credential errors', async () => {
  const unknown = fixture({ missing: true });
  const wrong = fixture();
  wrong.request.body.password = 'Another valid-length wrong password';
  await login(unknown.request, unknown.result);
  await login(wrong.request, wrong.result);
  for (const { request, result, events } of [unknown, wrong]) {
    assertSafe(result, 401);
    assert.equal(request.session.userId, undefined);
    assert.equal(events.length, 1);
  }
  assert.deepEqual(unknown.result.body, wrong.result.body);
});

for (const failure of ['lookup', 'regenerate', 'save']) {
  test(`login ${failure} failure returns safe error and destroys session`, async () => {
    const { request, result, events } = fixture({ failure });
    await login(request, result);
    assertSafe(result, 503);
    assert.equal(request.session, undefined);
    assert.equal(events.at(-1), 'destroy');
  });
}

test('login fails safely when database or session middleware is absent', async () => {
  for (const missing of ['database', 'session']) {
    const { request, result } = fixture();
    if (missing === 'database') delete request.app.locals.db;
    else delete request.session;
    await login(request, result);
    assertSafe(result, 503);
  }
});

test('logout destroys the server session before clearing the cookie', async () => {
  const { request, result, events } = fixture();
  await logout(request, result);
  assertSafe(result, 204);
  assert.deepEqual(events, ['destroy']);
  assert.equal(request.session, undefined);
  assert.deepEqual(result.cleared, {
    name: 'callingin.sid',
    options: { path: '/' },
  });
  assert.equal(result.ended, true);
});

test('logout does not report success when session destruction fails', async () => {
  const { request, result } = fixture({ failure: 'destroy' });
  await logout(request, result);
  assertSafe(result, 503);
  assert.equal(result.cleared, undefined);
});

test('logout requires session middleware', async () => {
  const { request, result } = fixture();
  delete request.session;
  await logout(request, result);
  assertSafe(result, 503);
});

test('current user requires a valid session account ID before querying storage', async () => {
  for (const id of [undefined, '', 'invalid']) {
    const { request, result, events } = fixture();
    request.session.userId = id;
    await currentUser(request, result);
    assertSafe(result, 401);
    assert.deepEqual(events, []);
  }
});

test('current user queries public fields and returns no password hash', async () => {
  const { request, result, events } = fixture();
  request.session.userId = account._id.toHexString();
  await currentUser(request, result);
  assertSafe(result, 200);
  assert.equal(result.body.user.id, account._id.toHexString());
  assert.deepEqual(events[0], {
    filter: { _id: account._id },
    projection: { projection: { displayName: 1, email: 1 } },
  });
});

test('deleted accounts lose their session and receive unauthorized response', async () => {
  const { request, result, events } = fixture({ missing: true });
  request.session.userId = account._id.toHexString();
  await currentUser(request, result);
  assertSafe(result, 401);
  assert.equal(events.at(-1), 'destroy');
  assert.equal(request.session, undefined);
  assert.equal(result.cleared.name, 'callingin.sid');
});

for (const failure of ['lookup', 'destroy', 'database']) {
  test(`current-user ${failure} failure returns a safe service error`, async () => {
    const { request, result } = fixture({
      failure,
      missing: failure === 'destroy',
    });
    request.session.userId = account._id.toHexString();
    if (failure === 'database') delete request.app.locals.db;
    await currentUser(request, result);
    assertSafe(result, 503);
  });
}

test('profile update uses session identity, trims name, and returns only public data', async () => {
  const { request, result, events } = fixture();
  request.session.userId = account._id.toHexString();
  request.body = { displayName: '  Updated Person  ' };
  await updateProfile(request, result);
  assertSafe(result, 200);
  assert.deepEqual(result.body.user, {
    id: account._id.toHexString(),
    email: account.email,
    displayName: 'Updated Person',
  });
  assert.deepEqual(events, [
    {
      filter: { _id: account._id },
      update: { $set: { displayName: 'Updated Person' } },
      options: {
        returnDocument: 'after',
        projection: { displayName: 1, email: 1 },
      },
    },
  ]);
});

test('profile update rejects invalid identities before accessing storage', async () => {
  for (const id of [undefined, '', 'invalid']) {
    const { request, result, events } = fixture();
    request.session.userId = id;
    request.body = { displayName: 'Updated' };
    await updateProfile(request, result);
    assertSafe(result, 401);
    assert.deepEqual(events, []);
  }
});

test('profile update rejects invalid names and additional fields without writing', async () => {
  for (const body of [
    null,
    [],
    {},
    { displayName: 12 },
    { displayName: '  ' },
    { displayName: 'x'.repeat(81) },
    ...['email', 'password', 'passwordHash', '_id', 'userId'].map((key) => ({
      displayName: 'Name',
      [key]: 'injected',
    })),
  ]) {
    const { request, result, events } = fixture();
    request.session.userId = account._id.toHexString();
    request.body = body;
    await updateProfile(request, result);
    assertSafe(result, 400);
    assert.deepEqual(events, []);
  }
});

test('profile update accepts an 80-character display name', async () => {
  const { request, result } = fixture();
  request.session.userId = account._id.toHexString();
  request.body = { displayName: 'x'.repeat(80) };
  await updateProfile(request, result);
  assertSafe(result, 200);
});

test('profile update invalidates a deleted account session', async () => {
  const { request, result, events } = fixture({ missing: true });
  request.session.userId = account._id.toHexString();
  request.body = { displayName: 'Updated' };
  await updateProfile(request, result);
  assertSafe(result, 401);
  assert.equal(events.at(-1), 'destroy');
  assert.equal(result.cleared.name, 'callingin.sid');
});

for (const failure of ['update', 'database', 'destroy']) {
  test(`profile update handles ${failure} failure safely`, async () => {
    const { request, result } = fixture({
      failure,
      missing: failure === 'destroy',
    });
    request.session.userId = account._id.toHexString();
    request.body = { displayName: 'Updated' };
    if (failure === 'database') delete request.app.locals.db;
    await updateProfile(request, result);
    assertSafe(result, 503);
    assert.equal(result.cleared, undefined);
  });
}
