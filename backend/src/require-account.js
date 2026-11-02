import { ObjectId } from 'mongodb';
import { SESSION_COOKIE_NAME } from './session.js';
import { logAccountFailure } from './safe-logging.js';

/**
 * Mount after session middleware. Only a freshly verified account ID is passed
 * to downstream handlers; session values alone are not proof of account access.
 * @type {import('express').RequestHandler}
 */
export async function requireAccount(request, response, next) {
  response.set('Cache-Control', 'no-store');
  delete response.locals.accountId;
  const session =
    /** @type {import('./authentication.js').AccountSession | undefined} */ (
      request.session
    );
  const userId = session?.userId;
  if (typeof userId !== 'string' || !/^[a-f0-9]{24}$/.test(userId)) {
    response.status(401).json({ error: 'Sign in to continue.' });
    return;
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  try {
    if (!db) throw new Error('Account storage unavailable.');
    const accountId = new ObjectId(userId);
    const account = await db
      .collection('users')
      .findOne({ _id: accountId }, { projection: { _id: 1 } });
    if (!account) {
      await invalidateSession(request);
      response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      response.status(401).json({ error: 'Sign in to continue.' });
      return;
    }
    response.locals.accountId = accountId;
  } catch (failure) {
    logAccountFailure(request, 'require-account', failure);
    response
      .status(503)
      .json({ error: 'Authentication is temporarily unavailable.' });
    return;
  }
  next();
}

/** @param {import('express').Request} request */
async function invalidateSession(request) {
  const session = /** @type {import('./authentication.js').AccountSession} */ (
    request.session
  );
  // Remove authorization even if the session store cannot complete destruction.
  delete session.userId;
  await new Promise((resolve, reject) => {
    session.destroy((error) => (error ? reject(error) : resolve(undefined)));
  });
}
