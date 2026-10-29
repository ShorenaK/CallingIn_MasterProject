import assert from 'node:assert/strict';
import { test } from 'node:test';
import app from '../src/app.js';
import { startTestServer } from '../test-support/server.js';

test('GET /api/health returns HTTP 200 and the JSON health contract', async (t) => {
  const baseUrl = await startTestServer(t, app);
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/json\b/);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('an unknown API route returns 404 rather than a healthy response', async (t) => {
  const baseUrl = await startTestServer(t, app);
  const response = await fetch(`${baseUrl}/api/missing`);

  assert.equal(response.status, 404);
  await response.text();
});
