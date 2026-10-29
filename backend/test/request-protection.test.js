import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequestProtection } from '../src/request-protection.js';

const origin = 'http://127.0.0.1:5173';

// Exercise the middleware directly: no HTTP server, database, or private
// environment configuration is needed to test its trust decisions.
function runRequest(method, headers = {}) {
  let nextCalls = 0;
  const response = {
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  const request = {
    method,
    get: (name) => headers[name.toLowerCase()],
  };
  createRequestProtection({ APP_ORIGIN: origin })(request, response, () => {
    nextCalls += 1;
  });
  return { response, nextCalls };
}

test('invalid trusted-origin settings fail during setup', () => {
  // Do not silently accept URLs that broaden or disguise the configured origin.
  for (const APP_ORIGIN of [
    undefined,
    '',
    '*',
    'null',
    'not a URL',
    'ftp://example.com',
    `${origin}/`,
    `${origin}/account`,
    `${origin}?query=value`,
    `${origin}#fragment`,
    'https://user:password@example.com',
    'https://example.com,https://other.example',
  ]) {
    assert.throws(() => createRequestProtection({ APP_ORIGIN }), /APP_ORIGIN/);
  }
});

test('production requires HTTPS while development permits local HTTP', () => {
  assert.throws(
    () =>
      createRequestProtection({ APP_ORIGIN: origin, NODE_ENV: 'production' }),
    /APP_ORIGIN must use HTTPS/,
  );
  assert.equal(
    typeof createRequestProtection({ APP_ORIGIN: origin }),
    'function',
  );
  assert.equal(
    typeof createRequestProtection({
      APP_ORIGIN: 'https://callingin.example',
      NODE_ENV: 'production',
    }),
    'function',
  );
});

test('safe methods pass without origin or JSON headers', () => {
  // This relies on the route contract: GET/HEAD/OPTIONS cannot mutate accounts.
  for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    const { response, nextCalls } = runRequest(method);
    assert.equal(nextCalls, 1);
    assert.equal(response.code, undefined);
  }
});

test('state-changing methods accept only the exact trusted origin and JSON', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const { response, nextCalls } = runRequest(method, {
      origin,
      'content-type': 'application/json; charset=utf-8',
    });
    assert.equal(nextCalls, 1);
    assert.equal(response.code, undefined);
  }
});

test('missing, opaque, and mismatched origins cannot reach write handlers', () => {
  for (const value of [
    undefined,
    'null',
    'https://untrusted.example',
    'http://localhost:5173',
    'http://127.0.0.1:5174',
    'https://127.0.0.1:5173',
    `${origin}.untrusted.example`,
    `${origin}, https://untrusted.example`,
  ]) {
    const { response, nextCalls } = runRequest('POST', {
      origin: value,
      'content-type': 'application/json',
    });
    assert.equal(response.code, 403);
    assert.equal(nextCalls, 0);
  }
});

test('form submissions and missing or misleading media types are rejected', () => {
  // Browser forms can send these encodings without the JSON API's preflight.
  for (const contentType of [
    undefined,
    '',
    'text/plain',
    'application/x-www-form-urlencoded',
    'multipart/form-data; boundary=test',
    'application/jsonp',
    'application/json-malicious',
  ]) {
    const { response, nextCalls } = runRequest('POST', {
      origin,
      'content-type': contentType,
    });
    assert.equal(response.code, 415);
    assert.equal(nextCalls, 0);
  }
});

test('JSON media type matching permits case differences and parameters', () => {
  for (const contentType of [
    'application/json',
    'Application/JSON; charset=UTF-8',
  ]) {
    const { nextCalls } = runRequest('POST', {
      origin,
      'content-type': contentType,
    });
    assert.equal(nextCalls, 1);
  }
});
