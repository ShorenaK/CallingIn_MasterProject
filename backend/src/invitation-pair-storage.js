import { isDeepStrictEqual } from 'node:util';
import { declineRetryAt } from './invitation-cooldown.js';

export const PAIR_HISTORY_INDEX = 'invitation_pair_history';
/** @typedef {{_id: string, invitationId: import('mongodb').ObjectId}} InvitationPair */

/** @param {import('mongodb').Db} db */
export function invitationPairs(db) {
  return /** @type {import('mongodb').Collection<InvitationPair>} */ (
    db.collection('invitationPairs')
  );
}
export const pairValidation = {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'invitationId'],
      additionalProperties: false,
      properties: {
        _id: { bsonType: 'string', pattern: '^[a-f0-9]{24}:[a-f0-9]{24}$' },
        invitationId: { bsonType: 'objectId' },
      },
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
};

/** Startup only verifies rollout prerequisites; never silently migrates an index.
 * @param {import('mongodb').Db} db
 */
export async function verifyResendStorage(db) {
  const collection = await db
    .listCollections({ name: 'invitationPairs' })
    .next();
  const options =
    collection && 'options' in collection ? collection.options : undefined;
  if (!matchesPairValidation(options))
    throw new Error(
      'Invitation resend migration must be reviewed and applied first.',
    );
  const indexes = await db.collection('invitations').listIndexes().toArray();
  const hasPermanent = indexes.some(
    (index) => index.unique && isDeepStrictEqual(index.key, { pairKey: 1 }),
  );
  const hasHistory = indexes.some(
    (index) =>
      index.name === PAIR_HISTORY_INDEX &&
      !index.unique &&
      isDeepStrictEqual(index.key, { pairKey: 1 }),
  );
  if (hasPermanent || !hasHistory)
    throw new Error(
      'Invitation pair indexes require the approved resend migration.',
    );
}

/** @param {Record<string, unknown> | undefined} options */
export function matchesPairValidation(options) {
  return Boolean(
    options &&
    isDeepStrictEqual(options.validator, pairValidation.validator) &&
    (options.validationLevel ?? 'strict') === 'strict' &&
    (options.validationAction ?? 'error') === 'error',
  );
}

/** @param {import('mongodb').Db} db
 * @param {import('./invitation-policy.js').Invitation[]} invitations
 * @param {boolean} enabled
 */
export async function currentDeclineIds(db, invitations, enabled) {
  const declined = invitations.filter(
    (invitation) =>
      invitation.status === 'declined' && declineRetryAt(invitation) !== null,
  );
  if (!enabled || !declined.length) return new Set();
  const pairs = await invitationPairs(db)
    .find({ _id: { $in: declined.map((invitation) => invitation.pairKey) } })
    .toArray();
  const current = new Map(
    pairs.map((pair) => [pair._id, pair.invitationId.toHexString()]),
  );
  return new Set(
    declined
      .filter(
        (invitation) =>
          current.get(invitation.pairKey) === invitation._id.toHexString(),
      )
      .map((invitation) => invitation._id.toHexString()),
  );
}
