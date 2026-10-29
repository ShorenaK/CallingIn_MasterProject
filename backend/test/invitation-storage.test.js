import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { prepareInvitations } from '../src/invitation-storage.js';
import {
  validInvitationMessage,
  invitationPairKey,
} from '../src/invitation-policy.js';

test('invitation messages require trimmed text within the 3000-character limit', () => {
  for (const value of [
    null,
    undefined,
    {},
    [],
    123,
    '',
    ' \n\t ',
    'x'.repeat(3001),
  ])
    assert.equal(validInvitationMessage(value), false);
  for (const value of [
    'x',
    '  hello  ',
    'x'.repeat(3000),
    `  ${'x'.repeat(3000)}  `,
  ])
    assert.equal(validInvitationMessage(value), true);
});

test('pair keys are stable across invitation directions and distinguish pairs', () => {
  const first = new ObjectId('000000000000000000000001');
  const second = new ObjectId('000000000000000000000002');
  const third = new ObjectId('000000000000000000000003');
  assert.equal(invitationPairKey(first, second), `${first}:${second}`);
  assert.equal(
    invitationPairKey(second, first),
    invitationPairKey(first, second),
  );
  assert.notEqual(
    invitationPairKey(first, third),
    invitationPairKey(first, second),
  );
});

test('storage prepares permanent uniqueness and both pagination indexes', async () => {
  const indexes = [];
  const db = {
    collection(name) {
      assert.equal(name, 'invitations');
      return {
        async createIndex(keys, options) {
          indexes.push({ keys, options });
        },
      };
    },
  };
  await prepareInvitations(db);
  assert.deepEqual(indexes, [
    {
      keys: { pairKey: 1 },
      options: { unique: true, name: 'invitation_pair_unique' },
    },
    {
      keys: { recipientId: 1, createdAt: -1, _id: -1 },
      options: { name: 'invitation_incoming' },
    },
    {
      keys: { senderId: 1, createdAt: -1, _id: -1 },
      options: { name: 'invitation_outgoing' },
    },
  ]);
});

test('index failure propagates and prevents subsequent index preparation', async () => {
  for (const failAt of [1, 2, 3]) {
    let calls = 0;
    const failure = new Error('simulated index failure');
    const db = {
      collection: () => ({
        async createIndex() {
          calls += 1;
          if (calls === failAt) throw failure;
        },
      }),
    };
    await assert.rejects(prepareInvitations(db), (error) => error === failure);
    assert.equal(calls, failAt);
  }
});
