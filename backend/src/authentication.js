import { ObjectId } from 'mongodb';
import { verifyPassword } from './password.js';
import { SESSION_COOKIE_NAME, setSessionPersistence } from './session.js';

/** @typedef {import('express-session').Session & {userId?: string}} AccountSession */
/** @typedef {{_id: ObjectId, displayName: string, email: string, passwordHash: string}} Account */
/** @typedef {{email: string, password: string, keepSignedIn?: boolean}} LoginInput */

// Public dummy data, never an account credential. Unknown accounts still incur
// the same scrypt work as existing accounts with a supported password hash.
const dummyHash = `scrypt$131072$8$1$${'00'.repeat(16)}$${'00'.repeat(64)}`;

/** @param {unknown} body @returns {body is LoginInput} */
function validLogin(body) {
  if (!body || typeof body !== 'object') return false;
  const input = /** @type {Partial<LoginInput>} */ (body);
  return (
    typeof input.email === 'string' &&
    input.email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) &&
    typeof input.password === 'string' &&
    input.password.length >= 15 &&
    input.password.length <= 128 &&
    (input.keepSignedIn === undefined ||
      typeof input.keepSignedIn === 'boolean')
  );
}

/** @param {Account} user */
function publicUser(user) {
  return {
    id: user._id.toHexString(),
    displayName: user.displayName,
    email: user.email,
  };
}

/**
 * Await callback-based session operations so success is sent only after storage
 * confirms completion. Regeneration replaces any pre-login session identifier.
 * @param {AccountSession} userSession
 * @param {'regenerate' | 'save' | 'destroy'} operation
 */
function sessionOperation(userSession, operation) {
  return new Promise((resolve, reject) => {
    userSession[operation]((error) =>
      error ? reject(error) : resolve(undefined),
    );
  });
}

/** @param {import('express').Response} response */
function unavailable(response) {
  return response
    .status(503)
    .json({ error: 'Authentication is temporarily unavailable.' });
}

/**
 * These handlers must be mounted behind session middleware and the planned
 * request-origin/CSRF and login-rate protections before exposing the routes.
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
export async function login(request, response) {
  response.set('Cache-Control', 'no-store');
  if (!validLogin(request.body)) {
    return response.status(400).json({
      error: 'Provide a valid email, password, and sign-in preference.',
    });
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  if (!db || !request.session) return unavailable(response);
  try {
    const user = await db.collection('users').findOne({
      email: request.body.email.trim().toLowerCase(),
    });
    const verified = await verifyPassword(
      request.body.password,
      user?.passwordHash ?? dummyHash,
    );
    if (!user || !verified) {
      return response
        .status(401)
        .json({ error: 'Email or password is incorrect.' });
    }
    await sessionOperation(request.session, 'regenerate');
    // Regeneration replaces request.session; never keep a reference to the old one.
    const activeSession = /** @type {AccountSession} */ (request.session);
    activeSession.userId = user._id.toHexString();
    setSessionPersistence(activeSession, request.body.keepSignedIn === true);
    await sessionOperation(activeSession, 'save');
    return response.json({ user: publicUser(/** @type {Account} */ (user)) });
  } catch {
    // Avoid a later middleware autosave granting login after an explicit save
    // failed. A store outage can still leave an orphan record until TTL cleanup.
    if (request.session) {
      await sessionOperation(request.session, 'destroy').catch(() => {});
    }
    return unavailable(response);
  }
}

/**
 * Destroy server state before clearing the browser cookie. A failed store
 * operation must not be reported as a successful logout.
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
export async function logout(request, response) {
  response.set('Cache-Control', 'no-store');
  if (!request.session) return unavailable(response);
  try {
    await sessionOperation(request.session, 'destroy');
    response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return response.status(204).end();
  } catch {
    return unavailable(response);
  }
}

/**
 * Read the account afresh so deleted accounts cannot keep accessing a profile.
 * Select public fields only; never return password hashes to the browser.
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
export async function currentUser(request, response) {
  response.set('Cache-Control', 'no-store');
  const userId = /** @type {AccountSession | undefined} */ (request.session)
    ?.userId;
  if (!userId || !/^[a-f0-9]{24}$/.test(userId)) {
    return response.status(401).json({ error: 'Sign in to continue.' });
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  if (!db) return unavailable(response);
  try {
    const user = await db
      .collection('users')
      .findOne(
        { _id: new ObjectId(userId) },
        { projection: { displayName: 1, email: 1 } },
      );
    if (!user) {
      await sessionOperation(request.session, 'destroy');
      response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      return response.status(401).json({ error: 'Sign in to continue.' });
    }
    return response.json({ user: publicUser(/** @type {Account} */ (user)) });
  } catch {
    return unavailable(response);
  }
}

/** @param {unknown} input */
function validProfileUpdate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const body = /** @type {{displayName?: unknown}} */ (input);
  return (
    Object.keys(body).every((key) => key === 'displayName') &&
    typeof body.displayName === 'string' &&
    body.displayName.trim().length >= 1 &&
    body.displayName.trim().length <= 80
  );
}

/**
 * Update only the signed-in account's display name. Explicitly allow fields so
 * profile edits cannot change credentials or target another account.
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
export async function updateProfile(request, response) {
  response.set('Cache-Control', 'no-store');
  const userId = /** @type {AccountSession | undefined} */ (request.session)
    ?.userId;
  if (!userId || !/^[a-f0-9]{24}$/.test(userId)) {
    return response.status(401).json({ error: 'Sign in to continue.' });
  }
  const body = request.body;
  if (!validProfileUpdate(body)) {
    return response.status(400).json({
      error: 'Provide only a display name of 1–80 characters.',
    });
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  if (!db) return unavailable(response);
  try {
    const user = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: { displayName: body.displayName.trim() } },
      {
        returnDocument: 'after',
        projection: { displayName: 1, email: 1 },
      },
    );
    if (!user) {
      await sessionOperation(request.session, 'destroy');
      response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      return response.status(401).json({ error: 'Sign in to continue.' });
    }
    return response.json({ user: publicUser(/** @type {Account} */ (user)) });
  } catch {
    return unavailable(response);
  }
}
