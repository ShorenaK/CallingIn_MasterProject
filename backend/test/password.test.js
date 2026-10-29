import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { hashPassword } from '../src/registration.js';
import { verifyPassword } from '../src/password.js';

// Generate one real registration hash to verify compatibility without repeating
// the expensive setup for every case. This password is public test data only.
const password = '  My test password keeps its spaces  ';
let storedHash;
before(async () => {
  storedHash = await hashPassword(password);
});

test('accepts the exact password for a real registration hash', async () => {
  assert.equal(await verifyPassword(password, storedHash), true);
});

test('rejects a different password and preserves significant whitespace', async () => {
  for (const candidate of [
    'A completely different test password',
    password.trim(),
    password.toLowerCase(),
  ]) {
    assert.equal(await verifyPassword(candidate, storedHash), false);
  }
});

test('rejects password inputs outside the registration contract', async () => {
  for (const candidate of [
    undefined,
    null,
    123,
    {},
    '',
    'x'.repeat(14),
    'x'.repeat(129),
  ]) {
    assert.equal(await verifyPassword(candidate, storedHash), false);
  }
});

test('rejects missing, non-string, truncated, and malformed hashes', async () => {
  for (const hash of [
    undefined,
    null,
    123,
    {},
    '',
    storedHash.slice(0, -1),
    `${storedHash}00`,
    `${storedHash}\n`,
    storedHash.replace('scrypt$', 'argon2$'),
    storedHash.replace(/.$/, 'z'),
    storedHash.replace(/\$[a-f0-9]{32}\$/, '$invalid-salt$'),
  ]) {
    assert.equal(await verifyPassword(password, hash), false);
  }
});

test('rejects unsupported cost parameters instead of executing them', async () => {
  // Stored values must never control crypto resource costs. Even a lower cost
  // is unsupported until a deliberate password-format migration is implemented.
  for (const hash of [
    storedHash.replace('$131072$', '$262144$'),
    storedHash.replace('$131072$', '$16384$'),
    storedHash.replace('$8$', '$16$'),
    storedHash.replace('$1$', '$2$'),
  ]) {
    assert.equal(await verifyPassword(password, hash), false);
  }
});

test('rejects a structurally valid hash containing the wrong derived key', async () => {
  const parts = storedHash.split('$');
  parts[5] = '00'.repeat(64);
  assert.equal(await verifyPassword(password, parts.join('$')), false);
});

test('registration and verification agree on password policy boundaries', async () => {
  const { validateRegistration } = await import('../src/registration.js');
  for (const length of [14, 15, 128, 129]) {
    const candidate = 'x'.repeat(length);
    const valid = length === 15 || length === 128;
    assert.equal(
      validateRegistration({
        displayName: 'Test',
        email: 'test@example.com',
        password: candidate,
      }) === null,
      valid,
    );
    if (valid) {
      const hash = await hashPassword(candidate);
      assert.equal(await verifyPassword(candidate, hash), true);
      assert.match(hash, /^scrypt\$131072\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    } else {
      assert.equal(await verifyPassword(candidate, storedHash), false);
    }
  }
});
