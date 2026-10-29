import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleError } from '../src/app.js';

test('unexpected errors return a generic 500 without leaking details', () => {
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
  handleError(new Error('private connection details'), {}, response, () =>
    assert.fail('Must respond'),
  );
  assert.equal(response.code, 500);
  assert.deepEqual(response.body, { error: 'An unexpected error occurred.' });
});

test('errors after headers are sent delegate instead of sending a second response', () => {
  const error = new Error('late failure');
  let forwarded;
  handleError(error, {}, { headersSent: true }, (value) => {
    forwarded = value;
  });
  assert.equal(forwarded, error);
});
