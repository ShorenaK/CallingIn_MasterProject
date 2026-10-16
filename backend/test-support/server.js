import { once } from 'node:events';

export async function startTestServer(t, app) {
  const server = app.listen(0, '127.0.0.1');
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeIdleConnections();
      }),
  );
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}
