import {
  validPassword,
  SCRYPT_OPTIONS,
  SCRYPT_KEY_LENGTH,
  SCRYPT_SALT_BYTES,
  HASH_PREFIX,
  SUPPORTED_HASH,
} from './account-policy.js';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

/** @type {(password: string, salt: string, keylen: number, options: import('node:crypto').ScryptOptions) => Promise<Buffer>} */
const deriveKey = promisify(scrypt);

/** @param {string} password */
export async function hashPassword(password) {
  const salt = randomBytes(SCRYPT_SALT_BYTES).toString('hex');
  const key = await deriveKey(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
    SCRYPT_OPTIONS,
  );
  return `${HASH_PREFIX}${salt}$${key.toString('hex')}`;
}

/**
 * Verify an existing registration hash without changing the stored password.
 * Passwords are not trimmed or normalized: every entered character matters.
 * Invalid input and unsupported hashes return false; crypto/runtime errors
 * propagate so the caller can distinguish an outage from wrong credentials.
 *
 * This comparison is timing-safe for equal-length derived keys. The login
 * handler handles unknown accounts; route middleware limits login attempts.
 * @param {unknown} password
 * @param {unknown} storedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  if (!validPassword(password) || typeof storedHash !== 'string') return false;

  const match = SUPPORTED_HASH.exec(storedHash);
  if (!match || match[0] !== storedHash) return false;

  // Decode only after exact hexadecimal lengths have been validated. This
  // ensures timingSafeEqual receives two complete, equally sized buffers.
  const expectedKey = Buffer.from(match[2], 'hex');
  const actualKey = await deriveKey(
    password,
    match[1],
    SCRYPT_KEY_LENGTH,
    SCRYPT_OPTIONS,
  );
  return timingSafeEqual(actualKey, expectedKey);
}
