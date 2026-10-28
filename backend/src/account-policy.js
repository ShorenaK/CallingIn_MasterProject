export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;
export const SCRYPT_KEY_LENGTH = 64;
export const SCRYPT_SALT_BYTES = 16;
export const SCRYPT_OPTIONS = Object.freeze({
  N: 131072,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
});
export const HASH_PREFIX = `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$`;
// Only this application's fixed cost is supported; stored costs never drive work.
export const SUPPORTED_HASH = new RegExp(
  `^${HASH_PREFIX.replaceAll('$', '\\$')}([a-f0-9]{${SCRYPT_SALT_BYTES * 2}})\\$([a-f0-9]{${SCRYPT_KEY_LENGTH * 2}})$`,
);

/** @param {unknown} name @returns {name is string} */
export function validName(name) {
  return (
    typeof name === 'string' &&
    name.trim().length >= 1 &&
    name.trim().length <= 80
  );
}

/** @param {unknown} email @returns {email is string} */
export function validEmail(email) {
  return (
    typeof email === 'string' &&
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

/** @param {unknown} password @returns {password is string} */
export function validPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_MIN_LENGTH &&
    password.length <= PASSWORD_MAX_LENGTH
  );
}
