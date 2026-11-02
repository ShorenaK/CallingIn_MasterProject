import { apiRequest } from '../account/api.js';

/** @typedef {{id: string, invitationId: string, participantIds: string[], createdAt: string}} Conversation */
/** @typedef {{id: string, conversationId: string, senderId: string, text: string, createdAt: string}} Message */
/** @typedef {{messages: Message[], nextCursor: string | null}} MessagePage */
export const MESSAGE_MAX = 5000;

/** @param {unknown} id @returns {id is string} */
function validId(id) {
  return typeof id === 'string' && /^[a-f0-9]{24}$/.test(id);
}

/** @param {unknown} value */
function validDate(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function unexpectedResponse() {
  return new Error(
    'The server returned an unexpected response. Please try again.',
  );
}

/** @param {unknown} value @returns {value is Message} */
function validMessage(value) {
  const message = /** @type {Partial<Message> | null} */ (value);
  return (
    validId(message?.id) &&
    validId(message.conversationId) &&
    validId(message.senderId) &&
    typeof message.text === 'string' &&
    validDate(message.createdAt)
  );
}

/** @param {string} invitationId @param {string} userId */
export async function openConversation(invitationId, userId) {
  const data = /** @type {{conversation?: Conversation} | null} */ (
    await apiRequest(
      `/api/invitations/${encodeURIComponent(invitationId)}/conversation`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      },
    )
  );
  const room = data?.conversation;
  if (
    !validId(room?.id) ||
    room.invitationId !== invitationId ||
    !validParticipants(room.participantIds, userId) ||
    !validDate(room.createdAt)
  )
    throw unexpectedResponse();
  return room;
}

/** @param {string} id @param {string | null} [cursor] */
export async function listMessages(id, cursor) {
  const query = new URLSearchParams({ limit: '20' });
  if (cursor) query.set('cursor', cursor);
  const data = /** @type {MessagePage | null} */ (
    await apiRequest(
      `/api/conversations/${encodeURIComponent(id)}/messages?${query}`,
    )
  );
  if (
    !Array.isArray(data?.messages) ||
    !data.messages.every(
      (message) => validMessage(message) && message.conversationId === id,
    ) ||
    !(data.nextCursor === null || typeof data.nextCursor === 'string')
  )
    throw unexpectedResponse();
  return data;
}

/** @param {string} id @param {string} text @param {string} userId */
export async function sendMessage(id, text, userId) {
  const data = /** @type {{message?: Message} | null} */ (
    await apiRequest(`/api/conversations/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  );
  if (
    !validMessage(data?.message) ||
    data.message.conversationId !== id ||
    data.message.senderId !== userId
  )
    throw unexpectedResponse();
  return data.message;
}

/** @param {unknown} value @param {string} userId */
function validParticipants(value, userId) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(validId) &&
    new Set(value).size === 2 &&
    value.includes(userId)
  );
}
