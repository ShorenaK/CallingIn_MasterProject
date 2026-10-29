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
    createCollection: async () => {},
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
      createCollection: async () => {},
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

test('new collection receives strict validation before indexes', async () => {
  let prepared = false;
  const db = {
    async createCollection(name, options) {
      assert.equal(name, 'invitations');
      assert.equal(options.validationLevel, 'strict');
      assert.equal(options.validationAction, 'error');
      const schema = options.validator.$jsonSchema;
      assert.equal(schema.additionalProperties, false);
      assert.deepEqual(schema.required, Object.keys(schema.properties));
      for (const key of ['_id', 'senderId', 'recipientId'])
        assert.equal(schema.properties[key].bsonType, 'objectId');
      assert.equal(schema.properties.message.maxLength, 3000);
      assert.equal(
        new RegExp(schema.properties.message.pattern).test(' \n '),
        false,
      );
      assert.equal(
        new RegExp(schema.properties.message.pattern).test('hello'),
        true,
      );
      assert.deepEqual(schema.properties.status.enum, [
        'pending',
        'deferred',
        'accepted',
        'declined',
      ]);
      assert.deepEqual(schema.properties.respondedAt.bsonType, [
        'date',
        'null',
      ]);
      for (const key of ['createdAt', 'updatedAt'])
        assert.equal(schema.properties[key].bsonType, 'date');
      prepared = true;
    },
    collection: () => ({
      createIndex: async () => assert.equal(prepared, true),
    }),
  };
  await prepareInvitations(db);
});

test('existing collection receives validator update before indexes', async () => {
  let updated = false;
  let options;
  const db = {
    async createCollection(_name, settings) {
      options = settings;
      throw Object.assign(new Error('exists'), { code: 48 });
    },
    async command(command) {
      assert.deepEqual(command, { collMod: 'invitations', ...options });
      updated = true;
    },
    collection: () => ({
      createIndex: async () => assert.equal(updated, true),
    }),
  };
  await prepareInvitations(db);
});

test('validation setup failures propagate without preparing indexes', async () => {
  for (const stage of ['create', 'update', 'non-error']) {
    const failure =
      stage === 'non-error' ? { code: 48 } : new Error('private failure');
    const db = {
      async createCollection() {
        if (stage === 'update')
          throw Object.assign(new Error('exists'), { code: 48 });
        throw failure;
      },
      async command() {
        throw failure;
      },
      collection: () => assert.fail('Indexes must wait for validation'),
    };
    await assert.rejects(prepareInvitations(db), (error) => error === failure);
  }
});
