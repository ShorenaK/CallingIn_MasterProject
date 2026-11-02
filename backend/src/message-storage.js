import { isDeepStrictEqual } from 'node:util';

/** @typedef {{_id: import('mongodb').ObjectId, conversationId: import('mongodb').ObjectId, senderId: import('mongodb').ObjectId, text: string, createdAt: Date}} Message */

const properties = {
  _id: { bsonType: 'objectId' },
  conversationId: { bsonType: 'objectId' },
  senderId: { bsonType: 'objectId' },
  text: { bsonType: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
  createdAt: { bsonType: 'date' },
};

const validationOptions = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: Object.keys(properties),
      additionalProperties: false,
      properties,
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
};

/** @param {import('mongodb').Db} db */
async function verifyExistingValidation(db) {
  const collection = await db.listCollections({ name: 'messages' }).next();
  const options =
    collection && 'options' in collection ? collection.options : undefined;
  if (
    !options ||
    !isDeepStrictEqual(options.validator, validationOptions.validator) ||
    (options.validationLevel ?? 'strict') !== 'strict' ||
    (options.validationAction ?? 'error') !== 'error'
  ) {
    throw new Error(
      'Message validation differs. An administrator must update the collection validator.',
    );
  }
}

/** @param {import('mongodb').Db} db */
async function prepareValidation(db) {
  const existing = await db.listCollections({ name: 'messages' }).next();
  if (existing) {
    await verifyExistingValidation(db);
    return;
  }
  try {
    await db.createCollection('messages', validationOptions);
  } catch (failure) {
    // Another process may create the collection after inspection. Verify its
    // settings without requiring collMod privileges or weakening validation.
    if (
      !(failure instanceof Error) ||
      !('code' in failure) ||
      failure.code !== 48
    )
      throw failure;
    await verifyExistingValidation(db);
  }
}

/** @param {import('mongodb').Db} db */
export async function prepareMessages(db) {
  await prepareValidation(db);
  await db
    .collection('messages')
    .createIndex(
      { conversationId: 1, createdAt: -1, _id: -1 },
      { name: 'message_history' },
    );
}
