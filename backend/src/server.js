import app from './app.js';
import { connectDatabase } from './database.js';
import { prepareUsers } from './registration.js';

const port = process.env.PORT || 3001;

async function start() {
  const database = await connectDatabase();
  try {
    await prepareUsers(database.db);
  } catch {
    await database.close().catch(() => {});
    throw new Error(
      'Account storage setup failed. Check database permissions and existing accounts.',
    );
  }
  app.locals.db = database.db;
  console.log('MongoDB connected and ping verified.');

  const server = app.listen(port, '127.0.0.1', (error) => {
    if (error) {
      console.error(
        'CallingIn backend failed to listen. Check the port configuration.',
      );
      void database.close().finally(() => {
        process.exitCode = 1;
      });
      return;
    }
    console.log(`CallingIn backend listening at http://127.0.0.1:${port}`);
  });

  function shutdown() {
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(() => {
      void database.close().then(
        () => process.exit(0),
        () => process.exit(1),
      );
    });
    server.closeIdleConnections();
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
