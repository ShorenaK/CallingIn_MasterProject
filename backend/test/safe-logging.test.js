import assert from 'node:assert/strict';
import { test } from 'node:test';
import { logAccountFailure } from '../src/safe-logging.js';
import { register } from '../src/registration.js';

function capture() {
  const logs = [];
  const request = {
    app: { locals: { logger: { error: (...args) => logs.push(args) } } },
  };
  return { request, logs };
}

test('logging emits only fixed operations and allowlisted error metadata', () => {
  const { request, logs } = capture();
  const error = new Error(
    'mongodb://private:password@host passwordHash secret',
  );
  error.name = 'MongoNetworkError';
  error.code = 'ECONNRESET';
  logAccountFailure(request, 'login', error);
  assert.deepEqual(logs, [
    [
      'Account operation failed',
      { operation: 'login', name: 'MongoNetworkError', code: 'ECONNRESET' },
    ],
  ]);
  assert.doesNotMatch(JSON.stringify(logs), /private|password|mongodb:|secret/);
});

test('logging rejects arbitrary error names, codes, and non-Error values', () => {
  const { request, logs } = capture();
  const error = new Error('private');
  error.name = 'passwordHash secret';
  error.code = 'mongodb://credentials';
  for (const value of [
    error,
    { name: 'Error', code: 'ECONNRESET' },
    'private',
    null,
  ]) {
    logAccountFailure(request, 'registration', value);
  }
  assert.ok(
    logs.every(
      (entry) =>
        entry[1].name === 'UnknownError' && entry[1].code === 'UNKNOWN',
    ),
  );
  assert.doesNotMatch(JSON.stringify(logs), /private|passwordHash|mongodb/);
});

test('logger failure does not escape into account handling', () => {
  const request = {
    app: {
      locals: {
        logger: {
          error() {
            throw new Error('logger unavailable');
          },
        },
      },
    },
  };
  assert.doesNotThrow(() =>
    logAccountFailure(request, 'logout', new Error('storage failed')),
  );
});

test('registration storage errors are safely logged without request data', async () => {
  const { request, logs } = capture();
  request.body = {
    displayName: 'Test',
    email: 'private@example.com',
    password: 'Public test registration password',
  };
  request.app.locals.db = {
    collection: () => ({
      insertOne() {
        throw new Error('mongodb://private passwordHash');
      },
    }),
  };
  const result = {
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
    },
  };
  await register(request, result);
  assert.equal(result.code, 503);
  assert.equal(logs[0][1].operation, 'registration');
  assert.doesNotMatch(
    JSON.stringify(logs),
    /mongodb|passwordHash|private@example|Public test/,
  );
});
