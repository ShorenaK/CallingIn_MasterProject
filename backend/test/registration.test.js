import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { createApp } from '../src/app.js';
import { startTestServer } from '../test-support/server.js';
import { hashPassword, prepareUsers } from '../src/registration.js';

const input = {
  displayName: ' Student ',
  email: ' STUDENT@example.com ',
  password: 'test-password-123',
};

async function start(t, db) {
  const baseUrl = await startTestServer(t, createApp(db));
  return (body = input, raw = false) =>
    fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw ? body : JSON.stringify(body),
    });
}

function fakeDb(insertOne) {
  return { collection: () => ({ insertOne }) };
}

test('registration normalizes fields, ignores injected fields, stores a hash, and returns only public data', async (t) => {
  let saved;
  const post = await start(
    t,
    fakeDb(async (user) => {
      saved = user;
      return { insertedId: 'test-id' };
    }),
  );
  const response = await post({
    ...input,
    role: 'admin',
    passwordHash: 'injected',
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    user: {
      id: 'test-id',
      displayName: 'Student',
      email: 'student@example.com',
    },
  });
  assert.match(saved.passwordHash, /^scrypt\$/);
  assert.equal(saved.password, undefined);
  assert.equal(saved.role, undefined);
  assert.ok(saved.createdAt instanceof Date);
  const [, n, r, p, salt, expected] = saved.passwordHash.split('$');
  const actual = await promisify(scrypt)(input.password, salt, 64, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 256 * 1024 * 1024,
  });
  assert.equal(actual.toString('hex'), expected);
});

test('invalid fields and malformed JSON do not write accounts', async (t) => {
  const post = await start(
    t,
    fakeDb(() => assert.fail('Invalid request must not write')),
  );
  for (const body of [
    null,
    {},
    { ...input, displayName: ' ' },
    { ...input, email: { $gt: '' } },
    { ...input, password: 'short' },
    { ...input, password: 'x'.repeat(129) },
  ]) {
    assert.equal((await post(body)).status, 400);
  }
  assert.equal((await post('{bad', true)).status, 400);
  assert.equal(
    (await post({ ...input, displayName: 'x'.repeat(20000) })).status,
    413,
  );
});

test('duplicate email returns 409 without exposing database error details', async (t) => {
  const post = await start(
    t,
    fakeDb(async () => {
      throw Object.assign(new Error('private details'), { code: 11000 });
    }),
  );
  const response = await post();
  assert.equal(response.status, 409);
  assert.doesNotMatch(await response.text(), /private details|passwordHash/);
});

test('missing database returns 503', async (t) => {
  const post = await start(t);
  assert.equal((await post()).status, 503);
});

test('database write failures return a safe 503', async (t) => {
  const post = await start(
    t,
    fakeDb(async () => {
      throw new Error('mongodb://secret');
    }),
  );
  const response = await post();
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret|mongodb/);
});

test('password hashes use different salts for identical passwords', async () => {
  assert.notEqual(
    await hashPassword(input.password),
    await hashPassword(input.password),
  );
});

test('account setup requests a unique email index', async () => {
  await prepareUsers({
    collection: (name) => {
      assert.equal(name, 'users');
      return {
        createIndex: async (keys, options) => {
          assert.deepEqual(keys, { email: 1 });
          assert.deepEqual(options, { unique: true });
        },
      };
    },
  });
});

test('non-Error storage failures still return a safe response', async (t) => {
  const post = await start(
    t,
    fakeDb(async () => {
      throw 'private non-Error failure';
    }),
  );
  const response = await post();
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private non-Error failure/);
});

test('registration rejects full email in passwords regardless of case without writing', async (t) => {
  const post = await start(
    t,
    fakeDb(() => assert.fail('Must not write rejected credentials')),
  );
  for (const password of ['a@b.co123', 'prefix-A@B.CO-end']) {
    const result = await post({ ...input, email: ' A@b.co ', password });
    assert.equal(result.status, 400);
    assert.deepEqual(await result.json(), {
      error: 'Password must not contain your email address.',
    });
  }
});

test('eight-character password registration stores a working hash', async (t) => {
  let saved;
  const post = await start(
    t,
    fakeDb(async (user) => {
      saved = user;
      return { insertedId: 'test-id' };
    }),
  );
  const result = await post({ ...input, password: 'abcd1234' });
  assert.equal(result.status, 201);
  await result.arrayBuffer();
  const { verifyPassword } = await import('../src/password.js');
  assert.equal(await verifyPassword('abcd1234', saved.passwordHash), true);
});

test('email restriction uses full address and does not change existing password verification', async () => {
  const { validateRegistration } = await import('../src/registration.js');
  assert.equal(
    validateRegistration({ ...input, password: 'student1234' }),
    null,
  );
  const { verifyPassword } = await import('../src/password.js');
  const existing = 'STUDENT@example.com';
  assert.equal(
    await verifyPassword(existing, await hashPassword(existing)),
    true,
  );
});

test('registration rejects whitespace and lengths outside 8–18 before writing', async (t) => {
  for (const password of [
    'x'.repeat(7),
    'x'.repeat(19),
    'abcd 1234',
    ' abcd1234',
    'abcd1234 ',
    'abcd\t1234',
    'abcd\n1234',
    'abcd\u30001234',
  ]) {
    const post = await start(
      t,
      fakeDb(() => assert.fail('Must not write')),
    );
    const result = await post({ ...input, password });
    assert.equal(result.status, 400);
    assert.deepEqual(await result.json(), {
      error: /\s/u.test(password)
        ? 'Password must not contain spaces.'
        : 'Password must be 8–18 characters.',
    });
  }
});
