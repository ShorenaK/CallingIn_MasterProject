import { createApp } from './app.js';
import { connectDatabase } from './database.js';
import { prepareUsers } from './registration.js';

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

const defaults = {
  connect: connectDatabase,
  prepare: prepareUsers,
  makeApp: createApp,
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
    makeApp,
    runtime,
    logger,
    timers,
    shutdownTimeoutMs,
    port = process.env.PORT || 3001,
  } = { ...defaults, ...options };
  const database = await connect();
  let stage =
    'Account storage setup failed. Check database permissions and existing accounts.';
  let server;
  try {
    await prepare(database.db);
    stage = 'CallingIn backend failed to listen. Check the port configuration.';
    server = await listen(makeApp(database.db), port);
  } catch {
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
