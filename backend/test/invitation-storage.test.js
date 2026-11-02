import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'mongodb';
import { prepareInvitations } from '../src/invitation-storage.js';
import {
  validInvitationMessage,
  invitationPairKey,
} from '../src/invitation-policy.js';

test('invitation messages require trimmed text within the 5000-character limit', () => {
  for (const value of [
    null,
    undefined,
    {},
    [],
    123,
    '',
    ' \n\t ',
    'x'.repeat(5001),
  ])
    assert.equal(validInvitationMessage(value), false);
  for (const value of [
    'x',
    '  hello  ',
    'x'.repeat(5000),
    `  ${'x'.repeat(5000)}  `,
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
    listCollections: () => ({ next: async () => null }),
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
      listCollections: () => ({ next: async () => null }),
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
    listCollections: () => ({ next: async () => null }),
    async createCollection(name, options) {
      assert.equal(name, 'invitations');
      assert.equal(options.validationLevel, 'strict');
      assert.equal(options.validationAction, 'error');
      const schema = options.validator.$jsonSchema;
      assert.equal(schema.additionalProperties, false);
      assert.deepEqual(schema.required, Object.keys(schema.properties));
      for (const key of ['_id', 'senderId', 'recipientId'])
        assert.equal(schema.properties[key].bsonType, 'objectId');
      assert.equal(schema.properties.message.maxLength, 5000);
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

async function expectedValidation() {
  let options;
  await prepareInvitations({
    listCollections: () => ({ next: async () => null }),
    createCollection: async (_name, settings) => {
      options = settings;
    },
    collection: () => ({ createIndex: async () => {} }),
  });
  return structuredClone(options);
}

test('matching collection skips creation and modification, including default settings', async () => {
  for (const defaults of [false, true]) {
    const options = await expectedValidation();
    if (defaults) {
      delete options.validationLevel;
      delete options.validationAction;
    }
    let indexes = 0;
    await prepareInvitations({
      listCollections: (filter) => {
        assert.deepEqual(filter, { name: 'invitations' });
        return { next: async () => ({ options }) };
      },
      createCollection: () =>
        assert.fail('Must not create existing collection'),
      command: () => assert.fail('Must not modify validator'),
      collection: () => ({
        createIndex: async () => {
          indexes += 1;
        },
      }),
    });
    assert.equal(indexes, 3);
  }
});

test('mismatched validators or weak settings stop startup before indexes', async () => {
  for (const change of [
    (options) => {
      options.validator = {};
    },
    (options) => {
      options.validationLevel = 'moderate';
    },
    (options) => {
      options.validationAction = 'warn';
    },
  ]) {
    const options = await expectedValidation();
    change(options);
    await assert.rejects(
      prepareInvitations({
        listCollections: () => ({ next: async () => ({ options }) }),
        collection: () => assert.fail('Indexes must wait'),
        command: () => assert.fail('No automatic administrative update'),
      }),
      /administrator must update/,
    );
  }
});

test('concurrent collection creation verifies the winner without modification', async () => {
  const options = await expectedValidation();
  let reads = 0;
  await prepareInvitations({
    listCollections: () => ({
      next: async () => (++reads === 1 ? null : { options }),
    }),
    createCollection: async () => {
      throw Object.assign(new Error('exists'), { code: 48 });
    },
    collection: () => ({ createIndex: async () => {} }),
    command: () => assert.fail('Must not modify validator'),
  });
  assert.equal(reads, 2);
});

test('inspection, creation and race verification failures propagate before indexes', async () => {
  for (const stage of [
    'inspect',
    'create',
    'race-read',
    'race-missing',
    'non-error',
  ]) {
    const failure =
      stage === 'non-error' ? { code: 48 } : new Error('private failure');
    let reads = 0;
    const db = {
      listCollections: () => ({
        async next() {
          reads += 1;
          if (stage === 'inspect' || (stage === 'race-read' && reads > 1))
            throw failure;
          return null;
        },
      }),
      async createCollection() {
        if (stage.startsWith('race'))
          throw Object.assign(new Error('exists'), { code: 48 });
        throw failure;
      },
      collection: () => assert.fail('Indexes must wait for validation'),
    };
    if (stage === 'race-missing')
      await assert.rejects(prepareInvitations(db), /administrator must update/);
    else
      await assert.rejects(
        prepareInvitations(db),
        (error) => error === failure,
      );
  }
});

test('existing collection without validation rules requires an administrator update', async () => {
  await assert.rejects(
    prepareInvitations({
      listCollections: () => ({ next: async () => ({ options: {} }) }),
      createCollection: () =>
        assert.fail('Must not recreate existing collection'),
      collection: () =>
        assert.fail('Must not prepare indexes without validation'),
      command: () =>
        assert.fail('Must not automatically modify collection rules'),
    }),
    /administrator must update/,
  );
});

test('existing validator allowing 6000 characters is rejected instead of weakening policy', async () => {
  const options = await expectedValidation();
  options.validator.$jsonSchema.properties.message.maxLength = 6000;
  await assert.rejects(
    prepareInvitations({
      listCollections: () => ({ next: async () => ({ options }) }),
      createCollection: () =>
        assert.fail('Must not recreate existing collection'),
      collection: () =>
        assert.fail('Must not prepare indexes with weaker validation'),
      command: () =>
        assert.fail('Must not automatically modify collection rules'),
    }),
    /administrator must update/,
  );
});

test('existing 3000-character validator requires explicit migration to 5000', async () => {
  const options = await expectedValidation();
  options.validator.$jsonSchema.properties.message.maxLength = 3000;
  await assert.rejects(
    prepareInvitations({
      listCollections: () => ({ next: async () => ({ options }) }),
      collection: () =>
        assert.fail('Indexes must wait for validator migration'),
      command: () =>
        assert.fail('Must not automatically migrate the validator'),
    }),
    /administrator must update/,
  );
});
