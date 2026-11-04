import { isDeepStrictEqual } from 'node:util';
import { INVITATION_MESSAGE_MAX } from './invitation-policy.js';
import {
  verifyResendStorage,
  verifyLegacyInvitationStorage,
} from './invitation-pair-storage.js';

const properties = {
  _id: { bsonType: 'objectId' },
  senderId: { bsonType: 'objectId' },
  recipientId: { bsonType: 'objectId' },
  pairKey: { bsonType: 'string', pattern: '^[a-f0-9]{24}:[a-f0-9]{24}$' },
  message: {
    bsonType: 'string',
    minLength: 1,
    maxLength: INVITATION_MESSAGE_MAX,
    pattern: '\\S',
  },
  status: { enum: ['pending', 'deferred', 'accepted', 'declined'] },
  createdAt: { bsonType: 'date' },
  updatedAt: { bsonType: 'date' },
  respondedAt: { bsonType: ['date', 'null'] },
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
  const collection = await db.listCollections({ name: 'invitations' }).next();
  const options =
    collection && 'options' in collection ? collection.options : undefined;
  if (
    !options ||
    !isDeepStrictEqual(options.validator, validationOptions.validator) ||
    (options.validationLevel ?? 'strict') !== 'strict' ||
    (options.validationAction ?? 'error') !== 'error'
  ) {
    throw new Error(
      'Invitation validation differs. An administrator must update the collection validator.',
    );
  }
}

/** @param {import('mongodb').Db} db */
async function prepareValidation(db) {
  const existing = await db.listCollections({ name: 'invitations' }).next();
  if (existing) {
    await verifyExistingValidation(db);
    return;
  }
  try {
    await db.createCollection('invitations', validationOptions);
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

/**
 * Default-off rollout preserves permanent uniqueness until explicit migration.
 * Enabled mode verifies migrated storage and never drops/changes the old index.
 * Participant/time/ID indexes support stable newest-first cursor pagination.
 * No TTL index: invitations must not silently expire or lose consent history.
 * @param {import('mongodb').Db} db
 */
export async function prepareInvitations(db, resendEnabled = false) {
  await prepareValidation(db);
  const invitations = db.collection('invitations');
  if (resendEnabled) await verifyResendStorage(db);
  else {
    await verifyLegacyInvitationStorage(db);
    await invitations.createIndex(
      { pairKey: 1 },
      { unique: true, name: 'invitation_pair_unique' },
    );
  }
  await invitations.createIndex(
    { recipientId: 1, createdAt: -1, _id: -1 },
    { name: 'invitation_incoming' },
  );
  await invitations.createIndex(
    { senderId: 1, createdAt: -1, _id: -1 },
    { name: 'invitation_outgoing' },
  );
}
