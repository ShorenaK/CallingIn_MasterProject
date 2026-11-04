import {
  hasDeclineCooldownElapsed,
  declineRetryAt,
} from './invitation-cooldown.js';
import { invitationPairs } from './invitation-pair-storage.js';

export class InvitationConflict extends Error {
  /** @param {'INVITATION_COOLDOWN' | 'INVITATION_ACTIVE'} code */
  constructor(code) {
    super(
      code === 'INVITATION_COOLDOWN'
        ? 'Please wait 30 days after the decline before sending another invitation.'
        : 'An open or accepted invitation already exists between these accounts.',
    );
    this.code = code;
  }
}

/** A default-off rollout preserves the legacy policy until migration is approved.
 * @param {Record<string, string | undefined>} env
 */
export function invitationResendEnabled(env) {
  const value = env.INVITATION_RESEND_ENABLED;
  if (value !== undefined && value !== 'false' && value !== 'true')
    throw new Error('INVITATION_RESEND_ENABLED must be true or false.');
  return value === 'true';
}

/** Preserve history and serialize same-pair creation in a real MongoDB transaction.
 * No fallback to nontransactional writes is safe when this feature is enabled.
 * @param {import('mongodb').Db} db
 * @param {import('./invitation-policy.js').Invitation} invitation
 * @param {boolean} enabled
 */
export async function storeInvitation(db, invitation, enabled) {
  if (!enabled) {
    await db.collection('invitations').insertOne(invitation);
    return;
  }
  const session = db.client.startSession();
  try {
    await session.withTransaction(
      async () => {
        const pairs = invitationPairs(db);
        const invitations = db.collection('invitations');
        const pair = await pairs.findOne(
          { _id: invitation.pairKey },
          { session },
        );
        await checkCurrentInvitation({
          invitations,
          pair,
          invitation,
          session,
        });
        // Both simultaneous first invitations and re-invitations contend on this
        // unique _id. A write conflict must retry the whole transaction, not insert alone.
        await pairs.updateOne(
          { _id: invitation.pairKey },
          { $set: { invitationId: invitation._id } },
          { upsert: true, session },
        );
        await invitations.insertOne(invitation, { session });
      },
      { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } },
    );
  } finally {
    await session.endSession();
  }
}

/** @param {{invitations: import('mongodb').Collection, pair: import('mongodb').Document | null,
 * invitation: import('./invitation-policy.js').Invitation, session: import('mongodb').ClientSession}} options
 */
async function checkCurrentInvitation({
  invitations,
  pair,
  invitation,
  session,
}) {
  const current = await invitations.findOne(
    pair
      ? { _id: pair.invitationId, pairKey: invitation.pairKey }
      : { pairKey: invitation.pairKey },
    { session },
  );
  if (!pair && !current) return;
  if (!pair || !current)
    throw new Error('Invitation pair state requires administrator review.');
  if (current.status !== 'declined')
    throw new InvitationConflict('INVITATION_ACTIVE');
  const declined = /** @type {import('./invitation-policy.js').Invitation} */ (
    current
  );
  if (!declineRetryAt(declined))
    throw new Error('Decline timestamp requires administrator review.');
  // Evaluate server time on each transaction attempt; retries must not reuse a
  // stale status or assume an old invitation still represents this pair.
  if (!hasDeclineCooldownElapsed(declined, new Date()))
    throw new InvitationConflict('INVITATION_COOLDOWN');
}
