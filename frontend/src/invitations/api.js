import { apiRequest } from '../account/api.js';

/** @typedef {'pending' | 'deferred' | 'accepted' | 'declined'} InvitationStatus */
/** @typedef {'incoming' | 'outgoing'} Direction */
/**
 * @typedef {object} Invitation
 * @property {string} id
 * @property {string} message
 * @property {InvitationStatus} status
 * @property {string} createdAt
 * @property {{displayName: string} | null} [otherPerson] Lists only.
 */
/** @typedef {{invitations: Invitation[], nextCursor: string | null}} InvitationPage */

export const PAGE_SIZE = 10;
/** Must match the backend's INVITATION_MESSAGE_MAX (trimmed JS code units). */
export const MESSAGE_MAX = 5000;
const STATUSES = ['pending', 'deferred', 'accepted', 'declined'];

/** @param {Direction} direction @param {string | null} [cursor] */
export async function listInvitations(direction, cursor) {
  const query = new URLSearchParams({ direction, limit: String(PAGE_SIZE) });
  if (cursor) query.set('cursor', cursor);
  const data = /** @type {Partial<InvitationPage> | null} */ (
    await apiRequest(`/api/invitations?${query}`)
  );
  const valid =
    Array.isArray(data?.invitations) &&
    data.invitations.every(validInvitation) &&
    (typeof data.nextCursor === 'string' || data.nextCursor === null);
  if (!valid) throw unexpectedResponse();
  return /** @type {InvitationPage} */ (data);
}

/**
 * Recipient response. The server confirms identity and allowed transitions;
 * its reply omits `otherPerson`, so callers keep the name from the list.
 * @param {string} id
 * @param {Exclude<InvitationStatus, 'pending'>} status
 */
export async function respondToInvitation(id, status) {
  const data = /** @type {{invitation?: Invitation} | null} */ (
    await apiRequest(`/api/invitations/${encodeURIComponent(id)}/response`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  );
  if (!validInvitation(data?.invitation) || data?.invitation?.id !== id)
    throw unexpectedResponse();
  return data.invitation;
}

/** @typedef {{id: string, displayName: string}} Recipient */

/** Exact-email lookup; returns only the account ID and display name.
 * @param {string} email
 */
export async function lookupRecipient(email) {
  const data = /** @type {{user?: Partial<Recipient>} | null} */ (
    await apiRequest('/api/users/lookup', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  );
  const user = data?.user;
  if (
    typeof user?.id !== 'string' ||
    !/^[a-f0-9]{24}$/.test(user.id) ||
    typeof user.displayName !== 'string'
  )
    throw unexpectedResponse();
  return /** @type {Recipient} */ (user);
}

/** The sender is the signed-in account; the server never trusts a sender ID.
 * @param {string} recipientId @param {string} message
 */
export async function createInvitation(recipientId, message) {
  const data = /** @type {{invitation?: Invitation} | null} */ (
    await apiRequest('/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
    })
  );
  if (!validInvitation(data?.invitation)) throw unexpectedResponse();
  return /** @type {Invitation} */ (data?.invitation);
}

/** @param {unknown} value */
function validInvitation(value) {
  const item = /** @type {Partial<Invitation> | null} */ (value);
  return (
    typeof item?.id === 'string' &&
    typeof item.message === 'string' &&
    validDate(item.createdAt) &&
    STATUSES.includes(String(item.status)) &&
    validPerson(item.otherPerson)
  );
}

/** @param {unknown} value Server dates are exact ISO strings (toISOString). */
function validDate(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

/** @param {unknown} person */
function validPerson(person) {
  if (person === undefined || person === null) return true;
  return (
    typeof (/** @type {{displayName?: unknown}} */ (person).displayName) ===
    'string'
  );
}

function unexpectedResponse() {
  return new Error(
    'The server returned an unexpected response. Please try again.',
  );
}
