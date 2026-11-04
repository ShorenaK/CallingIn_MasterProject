import { ObjectId } from 'mongodb';
import { isDeepStrictEqual } from 'node:util';
import { invitationPairKey } from './invitation-policy.js';
import { declineRetryAt } from './invitation-cooldown.js';
import {
  invitationPairs,
  pairValidation,
  PAIR_HISTORY_INDEX,
  verifyResendStorage,
  matchesPairValidation,
} from './invitation-pair-storage.js';

/** Read-only internal plan contains pair/record identifiers, never message/email
 * content or credentials. The CLI displays counts only, not those identifiers.
 * Existing data must still obey the legacy one-record-per-pair rule.
 * @param {import('mongodb').Db} db
 */
export async function inspectResendMigration(db) {
  const topology = await db.command({ hello: 1 });
  if (!topology.setName && topology.msg !== 'isdbgrid')
    throw new Error(
      'Invitation resend requires a transaction-capable replica set or sharded cluster.',
    );
  const indexes = await db.collection('invitations').listIndexes().toArray();
  const permanent = indexes.filter(
    (index) => index.unique && isDeepStrictEqual(index.key, { pairKey: 1 }),
  );
  if (permanent.length !== 1)
    throw new Error(
      'Expected exactly one legacy permanent pair index; administrator review required.',
    );
  const pairs = new Map();
  const records = db.collection('invitations').find(
    {},
    {
      projection: {
        _id: 1,
        pairKey: 1,
        senderId: 1,
        recipientId: 1,
        status: 1,
        respondedAt: 1,
      },
    },
  );
  for await (const record of records) {
    validateLegacyRecord(record, pairs);
    pairs.set(record.pairKey, record._id);
  }
  return { pairs, legacyIndex: /** @type {string} */ (permanent[0].name) };
}

/** @param {import('mongodb').Document} record @param {Map<string, import('mongodb').ObjectId>} pairs */
function validateLegacyRecord(record, pairs) {
  if (
    !(record._id instanceof ObjectId) ||
    !(record.senderId instanceof ObjectId) ||
    !(record.recipientId instanceof ObjectId) ||
    record.senderId.equals(record.recipientId) ||
    invitationPairKey(record.senderId, record.recipientId) !== record.pairKey ||
    pairs.has(record.pairKey)
  )
    throw new Error('Invalid or duplicate invitation pair; migration stopped.');
  if (!['pending', 'deferred', 'accepted', 'declined'].includes(record.status))
    throw new Error('Invalid invitation status; migration stopped.');
  if (
    record.status === 'declined' &&
    !declineRetryAt(
      /** @type {import('./invitation-policy.js').Invitation} */ (record),
    )
  )
    throw new Error(
      'Declined invitation has no usable timestamp; migration stopped.',
    );
}

/** Explicit administrator operation; NEVER invoked by normal startup.
 * Writers must be stopped and a separately verified backup obtained first.
 * Resumable while the legacy index remains; never overwrites a conflicting pointer.
 * @param {import('mongodb').Db} db
 * @param {{database: string, writersStopped: boolean, backupReference: string}} approval
 */
export async function applyResendMigration(db, approval) {
  if (
    approval.database !== db.databaseName ||
    !approval.writersStopped ||
    !approval.backupReference.trim()
  )
    throw new Error(
      'Explicit database, stopped-writer and backup acknowledgments required.',
    );
  const plan = await inspectResendMigration(db);
  await preparePairCollection(db);
  for (const [_id, invitationId] of plan.pairs) {
    await invitationPairs(db).updateOne(
      { _id, invitationId },
      { $setOnInsert: { invitationId } },
      { upsert: true },
    );
  }
  await verifyPointers(db, plan.pairs);
  const recheck = await inspectResendMigration(db);
  if (!isDeepStrictEqual(recheck, plan))
    throw new Error(
      'Invitation data changed; stop all writers before migration.',
    );
  await db
    .collection('invitations')
    .createIndex({ pairKey: 1 }, { name: PAIR_HISTORY_INDEX });
  // Last destructive operation is index-only. Invitations/conversations are not deleted.
  await db.collection('invitations').dropIndex(plan.legacyIndex);
  await verifyResendStorage(db);
  return { migratedPairs: plan.pairs.size };
}

/** @param {import('mongodb').Db} db */
async function preparePairCollection(db) {
  const existing = await db.listCollections({ name: 'invitationPairs' }).next();
  if (!existing) {
    await db.createCollection('invitationPairs', pairValidation);
    return;
  }
  const options = 'options' in existing ? existing.options : undefined;
  if (!matchesPairValidation(options))
    throw new Error(
      'Existing invitation pair validation differs; migration stopped.',
    );
}

/** @param {import('mongodb').Db} db @param {Map<string, import('mongodb').ObjectId>} pairs */
async function verifyPointers(db, pairs) {
  const stored = await invitationPairs(db).find({}).toArray();
  if (
    stored.length !== pairs.size ||
    stored.some((pair) => !pairs.get(pair._id)?.equals(pair.invitationId))
  )
    throw new Error(
      'Invitation pair backfill differs; migration stopped before index removal.',
    );
}
