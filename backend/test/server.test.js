import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';

const run = promisify(execFile);

test('backend exits safely without listening when database settings are missing', async () => {
  await assert.rejects(
    run(process.execPath, ['src/server.js'], {
      cwd: new URL('../', import.meta.url),
      env: { ...process.env, MONGODB_URI: '', MONGODB_DB_NAME: '' },
      timeout: 10000,
    }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /Set MONGODB_URI and MONGODB_DB_NAME/);
      assert.doesNotMatch(error.stdout, /listening|connected/);
      return true;
    },
  );
});

test('backend sanitizes invalid connection strings and exits without listening', async () => {
  await assert.rejects(
    run(process.execPath, ['src/server.js'], {
      cwd: new URL('../', import.meta.url),
      env: {
        ...process.env,
        MONGODB_URI: 'invalid-uri-private-marker',
        MONGODB_DB_NAME: 'test',
      },
      timeout: 10000,
    }),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, /MongoDB connection failed/);
      assert.doesNotMatch(error.stderr, /invalid-uri-private-marker/);
      assert.doesNotMatch(error.stdout, /listening/);
      return true;
    },
  );
});
