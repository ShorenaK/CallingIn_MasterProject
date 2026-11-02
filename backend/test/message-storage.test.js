import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareMessages } from '../src/message-storage.js';

test('new collection receives strict validation before indexes', async () => {
  let prepared = false;
  const db = {
    listCollections: () => ({ next: async () => null }),
    async createCollection(name, options) {
      assert.equal(name, 'messages');
      assert.equal(options.validationLevel, 'strict');
      assert.equal(options.validationAction, 'error');
      const schema = options.validator.$jsonSchema;
      assert.equal(schema.additionalProperties, false);
      assert.deepEqual(schema.required, Object.keys(schema.properties));
      for (const key of ['_id', 'conversationId', 'senderId'])
        assert.equal(schema.properties[key].bsonType, 'objectId');
      assert.equal(schema.properties.text.maxLength, 5000);
      assert.equal(schema.properties.text.minLength, 1);
      assert.equal(
        new RegExp(schema.properties.text.pattern).test(' \n '),
        false,
      );
      assert.equal(
        new RegExp(schema.properties.text.pattern).test('hello'),
        true,
      );
      assert.equal(schema.properties.createdAt.bsonType, 'date');
      prepared = true;
    },
    collection: () => ({
      createIndex: async () => assert.equal(prepared, true),
    }),
  };
  await prepareMessages(db);
});

async function expectedValidation() {
  let options;
  await prepareMessages({
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
    await prepareMessages({
      listCollections: (filter) => {
        assert.deepEqual(filter, { name: 'messages' });
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
    assert.equal(indexes, 1);
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
      prepareMessages({
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
  await prepareMessages({
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
      await assert.rejects(prepareMessages(db), /administrator must update/);
    else
      await assert.rejects(prepareMessages(db), (error) => error === failure);
  }
});

test('existing collection without validation rules requires an administrator update', async () => {
  await assert.rejects(
    prepareMessages({
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

test('history index scopes conversations and orders messages; failures propagate', async () => {
  const failure = new Error('index failure');
  await assert.rejects(
    prepareMessages({
      listCollections: () => ({ next: async () => null }),
      createCollection: async () => {},
      collection: (name) => {
        assert.equal(name, 'messages');
        return {
          createIndex: async (keys, options) => {
            assert.deepEqual(keys, {
              conversationId: 1,
              createdAt: -1,
              _id: -1,
            });
            assert.deepEqual(options, {
              name: 'message_history',
            });
            throw failure;
          },
        };
      },
    }),
    (error) => error === failure,
  );
});
