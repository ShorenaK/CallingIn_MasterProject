import { createApp } from './app.js';
import { connectDatabase } from './database.js';
import { prepareUsers } from './registration.js';
import { createSessionMiddleware } from './session.js';
import { createRequestProtection } from './request-protection.js';
import { prepareInvitations } from './invitation-storage.js';

/**
 * @param {import('express').Express} app
 * @param {string | number} port
 * @returns {Promise<import('node:http').Server>}
 */
function listen(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(Number(port), '127.0.0.1');
    /** @param {Error} error */
    function onError(error) {
      server.removeListener('listening', onListening);
      reject(error);
    }
    function onListening() {
      server.removeListener('error', onError);
      resolve(server);
    }
    server.once('error', onError);
    server.once('listening', onListening);
  });
}

/**
 * @typedef {import('./database.js').DatabaseConnection} DatabaseConnection
 * @typedef {{runtime: NodeJS.Process, timers: {setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout}, shutdownTimeoutMs: number}} ShutdownOptions
 */

/**
 * @param {import('node:http').Server} server
 * @param {DatabaseConnection} database
 * @param {ShutdownOptions} options
 * @returns {() => Promise<void>}
 */
export function configureShutdown(server, database, options) {
  const { runtime, timers, shutdownTimeoutMs } = options;
  /** @type {Promise<void> | undefined} */
  let stopping;
  function stop() {
    if (stopping) return stopping;
    const deadline = timers.setTimeout(
      () => runtime.exit(1),
      shutdownTimeoutMs,
    );
    deadline.unref();
    stopping = new Promise(
      /** @param {(value?: void) => void} resolve */
      (resolve, reject) => {
        server.close((error) => {
          void database
            .close()
            .then(() => (error ? reject(error) : resolve()), reject);
        });
        server.closeIdleConnections();
      },
    ).finally(() => {
      timers.clearTimeout(deadline);
      runtime.removeListener('SIGINT', onSignal);
      runtime.removeListener('SIGTERM', onSignal);
    });
    return stopping;
  }
  function onSignal() {
    void stop().then(
      () => runtime.exit(0),
      () => runtime.exit(1),
    );
  }
  runtime.once('SIGINT', onSignal);
  runtime.once('SIGTERM', onSignal);
  return stop;
}

/**
 * Validate the browser trust boundary before creating the session index/store.
 * Await session preparation so no request can reach partially initialized auth.
 * Configuration is supplied explicitly for tests; private values are never logged.
 * @param {import('mongodb').Db} db
 * @param {Record<string, string | undefined>} env
 */
async function prepareAuthentication(db, env) {
  const requestProtection = createRequestProtection(env);
  const sessionMiddleware = await createSessionMiddleware(db, env);
  return { requestProtection, sessionMiddleware };
}

const defaults = {
  connect: connectDatabase,
  prepare: prepareUsers,
  prepareInvitations,
  makeApp: createApp,
  prepareAuthentication,
  env: process.env,
  runtime: process,
  logger: console,
  timers: { setTimeout, clearTimeout },
  shutdownTimeoutMs: 10000,
};

/** @param {Partial<typeof defaults> & {port?: string | number}} [options] */
export async function startBackend(options = {}) {
  const {
    connect,
    prepare,
    prepareInvitations,
    makeApp,
    prepareAuthentication,
    env,
    runtime,
    logger,
    timers,
    shutdownTimeoutMs,
    port = env.PORT || 3001,
  } = { ...defaults, ...options };
  const database = await connect();
  let stage =
    'Account storage setup failed. Check database permissions and existing accounts.';
  let server;
  try {
    await prepare(database.db);
    stage =
      'Invitation storage setup failed. Check database access and validation; schema differences require an administrator update.';
    await prepareInvitations(database.db);
    stage =
      'Authentication setup failed. Check SESSION_SECRET, APP_ORIGIN, and session storage permissions.';
    const authentication = await prepareAuthentication(database.db, env);
    stage = 'CallingIn backend failed to listen. Check the port configuration.';
    server = await listen(makeApp(database.db, authentication), port);
  } catch {
    // Session storage borrows this database's MongoClient. Closing the shared
    // connection once releases account and session resources, including failures
    // after session setup but before HTTP listening. Do not close the store too.
    await database.close().catch(() => {});
    throw new Error(stage);
  }
  const stop = configureShutdown(server, database, {
    runtime,
    timers,
    shutdownTimeoutMs,
  });
  logger.log('MongoDB connected and ping verified.');
  logger.log(
    `CallingIn backend listening at http://127.0.0.1:${/** @type {import('node:net').AddressInfo} */ (server.address()).port}`,
  );
  return { server, stop };
}
