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
