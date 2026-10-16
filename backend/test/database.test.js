import assert from 'node:assert/strict';
import { test } from 'node:test';
import { connectDatabase } from '../src/database.js';

const settings = {
  MONGODB_URI: 'mongodb://test.invalid',
  MONGODB_DB_NAME: 'callingin_test',
};

test('missing or placeholder settings fail before creating a client', async () => {
  for (const env of [
    {},
    { ...settings, MONGODB_URI: 'mongodb://<password>' },
  ]) {
    await assert.rejects(
      connectDatabase(env, () => assert.fail('Must not create a client')),
      /Set MONGODB_URI/,
    );
  }
});

test('a successful connection pings the selected database and can close', async () => {
  const events = [];
  const db = { command: async (command) => events.push(command) };
  const connection = await connectDatabase(settings, () => ({
    connect: async () => events.push('connect'),
    db: (name) => {
      assert.equal(name, 'callingin_test');
      return db;
    },
    close: async () => events.push('close'),
  }));
  assert.equal(connection.db, db);
  await connection.close();
  assert.deepEqual(events, ['connect', { ping: 1 }, 'close']);
});

for (const failure of ['connect', 'ping']) {
  test(`${failure} failure closes the client and hides sensitive errors`, async () => {
    let closed = false;
    const secretError = () => {
      throw new Error('private-password-in-driver-error');
    };
    await assert.rejects(
      connectDatabase(settings, () => ({
        connect: failure === 'connect' ? secretError : async () => {},
        db: () => ({ command: secretError }),
        close: async () => {
          closed = true;
        },
      })),
      (error) => {
        assert.match(error.message, /MongoDB connection failed/);
        assert.doesNotMatch(error.message, /private-password/);
        return true;
      },
    );
    assert.equal(closed, true);
  });
}

test('missing database name and whitespace-only URI are rejected', async () => {
  for (const env of [
    { ...settings, MONGODB_DB_NAME: ' ' },
    { ...settings, MONGODB_URI: ' ' },
  ]) {
    await assert.rejects(
      connectDatabase(env, () =>
        assert.fail('Invalid configuration must not connect'),
      ),
      /Set MONGODB_URI/,
    );
  }
});

test('client construction errors are sanitized even without a client to close', async () => {
  await assert.rejects(
    connectDatabase(settings, () => {
      throw new Error('private URI');
    }),
    {
      message:
        'MongoDB connection failed. Check credentials, Atlas IP access, and network connectivity.',
    },
  );
});

test('cleanup errors do not replace the safe connection failure message', async () => {
  await assert.rejects(
    connectDatabase(settings, () => ({
      connect: async () => {
        throw new Error('private connection failure');
      },
      close: async () => {
        throw new Error('private cleanup failure');
      },
    })),
    {
      message:
        'MongoDB connection failed. Check credentials, Atlas IP access, and network connectivity.',
    },
  );
});
