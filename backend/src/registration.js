import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64, {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
  });
  return `scrypt$131072$8$1$${salt}$${key.toString('hex')}`;
}

function validName(name) {
  return (
    typeof name === 'string' &&
    name.trim().length >= 1 &&
    name.trim().length <= 80
  );
}

function validEmail(email) {
  return (
    typeof email === 'string' &&
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

function validPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 15 &&
    password.length <= 128
  );
}

export function validateRegistration(body) {
  if (!body || !validName(body.displayName))
    return 'Display name must be 1–80 characters.';
  if (!validEmail(body.email))
    return 'Provide a valid email address of at most 254 characters.';
  if (!validPassword(body.password))
    return 'Password must be 15–128 characters.';
  return null;
}

export async function prepareUsers(db) {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
}

export async function register(request, response) {
  const error = validateRegistration(request.body);
  if (error) return response.status(400).json({ error });
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
    if (failure.code === 11000)
      return response
        .status(409)
        .json({ error: 'An account with that email already exists.' });
    return response
      .status(503)
      .json({ error: 'Registration is temporarily unavailable.' });
  }
}
