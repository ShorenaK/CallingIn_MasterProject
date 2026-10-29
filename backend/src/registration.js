import { hashPassword } from './password.js';
import { validName, validEmail, validPassword } from './account-policy.js';
import { logAccountFailure } from './safe-logging.js';

export { hashPassword };

/** @typedef {{displayName: string, email: string, password: string}} RegistrationInput */

/** @param {Partial<RegistrationInput> | null | undefined} body */
export function validateRegistration(body) {
  if (!body || !validName(body.displayName))
    return 'Display name must be 1–80 characters.';
  if (!validEmail(body.email))
    return 'Provide a valid email address of at most 254 characters.';
  if (!validPassword(body.password))
    return 'Password must be 15–128 characters.';
  return null;
}

/** @param {import('mongodb').Db} db */
export async function prepareUsers(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
}

/**
 * @param {import('express').Request<Record<string, string>, unknown, RegistrationInput>} request
 * @param {import('express').Response} response
 */
export async function register(request, response) {
  const error = validateRegistration(request.body);
  if (error) return response.status(400).json({ error });
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  if (!db)
    return response
      .status(503)
      .json({ error: 'Account storage is unavailable.' });

  try {
    const user = {
      displayName: request.body.displayName.trim(),
      email: request.body.email.trim().toLowerCase(),
      passwordHash: await hashPassword(request.body.password),
      createdAt: new Date(),
    };
    const result = await db.collection('users').insertOne(user);
    return response.status(201).json({
      user: {
        id: result.insertedId.toString(),
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (failure) {
    if (failure instanceof Error && 'code' in failure && failure.code === 11000)
      return response
        .status(409)
        .json({ error: 'An account with that email already exists.' });
    logAccountFailure(request, 'registration', failure);
    return response
      .status(503)
      .json({ error: 'Registration is temporarily unavailable.' });
  }
}
