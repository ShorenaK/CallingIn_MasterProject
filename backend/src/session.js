import session from 'express-session';
import MongoStore from 'connect-mongo';

export const SESSION_IDLE_MS = 90 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE_NAME = 'callingin.sid';

/**
 * Prepare storage before exposing middleware. The database lifecycle owns the
 * shared MongoClient; callers must not close this store independently.
 * @param {import('mongodb').Db} db
 * @param {Record<string, string | undefined>} [env]
 */
export async function createSessionMiddleware(db, env = process.env) {
  const secret = env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 bytes.');
  }

  await db
    .collection('sessions')
    .createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  const store = MongoStore.create({
    client: db.client,
    dbName: db.databaseName,
    collectionName: 'sessions',
    ttl: SESSION_IDLE_MS / 1000,
    touchAfter: 0,
    autoRemove: 'disabled',
  });
  await store.collectionP;

  return session({
    name: SESSION_COOKIE_NAME,
    secret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
    },
  });
}

/**
 * Call after regenerating a successful login's session. Persistent cookies roll
 * with activity; browser-session cookies use the store's same inactivity TTL.
 * @param {import('express-session').Session} userSession
 * @param {boolean} keepSignedIn
 */
export function setSessionPersistence(userSession, keepSignedIn) {
  userSession.cookie.maxAge = keepSignedIn ? SESSION_IDLE_MS : undefined;
}
