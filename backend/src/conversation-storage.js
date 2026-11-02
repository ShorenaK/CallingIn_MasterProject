import { isDeepStrictEqual } from 'node:util';

/**
 * @typedef {{_id: import('mongodb').ObjectId, invitationId: import('mongodb').ObjectId, participantIds: import('mongodb').ObjectId[], createdAt: Date}} Conversation
 */

const properties = {
  _id: { bsonType: 'objectId' },
  invitationId: { bsonType: 'objectId' },
  participantIds: {
    bsonType: 'array',
    minItems: 2,
    maxItems: 2,
    uniqueItems: true,
    items: { bsonType: 'objectId' },
  },
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
  const collection = await db.listCollections({ name: 'conversations' }).next();
  const options =
    collection && 'options' in collection ? collection.options : undefined;
  if (
    !options ||
    !isDeepStrictEqual(options.validator, validationOptions.validator) ||
    (options.validationLevel ?? 'strict') !== 'strict' ||
    (options.validationAction ?? 'error') !== 'error'
  ) {
    throw new Error(
      'Conversation validation differs. An administrator must update the collection validator.',
    );
  }
}

/** @param {import('mongodb').Db} db */
async function prepareValidation(db) {
  const existing = await db.listCollections({ name: 'conversations' }).next();
  if (existing) {
    await verifyExistingValidation(db);
    return;
  }
  try {
    await db.createCollection('conversations', validationOptions);
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

/** Prepare a strict collection and enforce one room per accepted invitation.
 * @param {import('mongodb').Db} db
 */
export async function prepareConversations(db) {
  await prepareValidation(db);
  await db
    .collection('conversations')
    .createIndex(
      { invitationId: 1 },
      { unique: true, name: 'conversation_invitation_unique' },
    );
}
