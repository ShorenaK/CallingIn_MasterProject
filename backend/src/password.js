import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

/** @type {(password: string, salt: string, keylen: number, options: import('node:crypto').ScryptOptions) => Promise<Buffer>} */
const deriveKey = promisify(scrypt);

// Accept only the format currently written by registration. Never use stored
// cost parameters directly: malformed records could request excessive resources.
const supportedHash = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;

/**
 * Verify an existing registration hash without changing the stored password.
 * Passwords are not trimmed or normalized: every entered character matters.
 * Invalid input and unsupported hashes return false; crypto/runtime errors
 * propagate so the caller can distinguish an outage from wrong credentials.
 *
 * This comparison is timing-safe for equal-length derived keys. The complete
 * login flow must separately handle unknown accounts and limit login attempts.
 * @param {unknown} password
 * @param {unknown} storedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  if (
    typeof password !== 'string' ||
    password.length < 15 ||
    password.length > 128 ||
    typeof storedHash !== 'string'
  ) {
    return false;
  }

  const match = supportedHash.exec(storedHash);
  if (!match || match[0] !== storedHash) return false;

  // Decode only after exact hexadecimal lengths have been validated. This
  // ensures timingSafeEqual receives two complete, equally sized buffers.
  const expectedKey = Buffer.from(match[2], 'hex');
  const actualKey = await deriveKey(password, match[1], 64, {
    N: 131072,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
  });
  return timingSafeEqual(actualKey, expectedKey);
}
