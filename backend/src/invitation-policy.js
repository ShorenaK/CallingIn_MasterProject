/** @typedef {'pending' | 'deferred' | 'accepted' | 'declined'} InvitationStatus */
/**
 * @typedef {object} Invitation
 * @property {import('mongodb').ObjectId} _id
 * @property {import('mongodb').ObjectId} senderId
 * @property {import('mongodb').ObjectId} recipientId
 * @property {string} pairKey
 * @property {string} message
 * @property {InvitationStatus} status
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Date | null} respondedAt
 */

export const INVITATION_MESSAGE_MAX = 3000;

/** @param {unknown} message @returns {message is string} */
export function validInvitationMessage(message) {
  if (typeof message !== 'string') return false;
  const length = message.trim().length;
  return length >= 1 && length <= INVITATION_MESSAGE_MAX;
}

/**
 * The same key covers both directions, including terminal invitations. Callers
 * must reject self-invitations before inserting a document.
 * @param {import('mongodb').ObjectId} first
 * @param {import('mongodb').ObjectId} second
 */
export function invitationPairKey(first, second) {
  return [first.toHexString(), second.toHexString()].sort().join(':');
}
