/** Thirty elapsed 24-hour days, independent of calendar months or DST. */
export const DECLINE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

/** @typedef {Pick<import('./invitation-policy.js').Invitation, 'status' | 'respondedAt'>} DeclineRecord */

/**
 * For declined invitations, respondedAt is the server-recorded final decline
 * time, not the send time or earlier Maybe Later time. Invalid/missing dates
 * fail closed. This calculation does not authorize a resend: the current
 * permanent pair index still blocks it until a separate migration/integration.
 * @param {DeclineRecord} invitation
 * @returns {Date | null}
 */
export function declineRetryAt(invitation) {
  if (invitation.status !== 'declined') return null;
  const declinedAt = invitation.respondedAt;
  if (!(declinedAt instanceof Date)) return null;
  const eligibleAt = new Date(declinedAt.getTime() + DECLINE_COOLDOWN_MS);
  return Number.isFinite(eligibleAt.getTime()) ? eligibleAt : null;
}

/** Timing only: a true result is not permission to insert a new invitation.
 * A future caller must check the current pair state, authorization, and index
 * rules as well. Never use a browser-supplied clock for enforcement.
 * @param {DeclineRecord} invitation
 * @param {Date} [now] Server time; injectable for deterministic tests.
 */
export function hasDeclineCooldownElapsed(invitation, now = new Date()) {
  const eligibleAt = declineRetryAt(invitation);
  return (
    eligibleAt !== null &&
    now instanceof Date &&
    Number.isFinite(now.getTime()) &&
    now.getTime() >= eligibleAt.getTime()
  );
}
