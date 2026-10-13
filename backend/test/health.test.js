import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import app from '../src/app.js';

async function startServer(t) {
  const server = app.listen(0, '127.0.0.1');
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

test('GET /api/health returns HTTP 200 and the JSON health contract', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/json\b/);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('an unknown API route returns 404 rather than a healthy response', async (t) => {
  const baseUrl = await startServer(t);
  const response = await fetch(`${baseUrl}/api/missing`);

  assert.equal(response.status, 404);
  await response.text();
});
