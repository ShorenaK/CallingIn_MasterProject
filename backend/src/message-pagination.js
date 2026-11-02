import { ObjectId } from 'mongodb';

/** @param {unknown} value */
function parseCursor(value) {
  if (typeof value !== 'string' || value.length !== 49) return null;
  const [timestamp, id] = value.split('~');
  if (!/^[a-f0-9]{24}$/.test(id ?? '')) return null;
  const createdAt = new Date(timestamp);
  if (
    !Number.isFinite(createdAt.getTime()) ||
    createdAt.toISOString() !== timestamp
  )
    return null;
  return { createdAt, id: new ObjectId(id) };
}

/** @param {unknown} limit */
function parseLimit(limit) {
  if (limit === undefined) return 20;
  if (typeof limit !== 'string' || !/^[1-9]\d?$/.test(limit)) return null;
  const size = Number(limit);
  return size <= 50 ? size : null;
}

/**
 * Reject unknown or repeated parameters rather than accepting ambiguous filters.
 * Cursors are positions, not authorization: every query still scopes identity.
 * @param {Record<string, unknown>} query
 */
export function parseMessageQuery(query) {
  if (!Object.keys(query).every((key) => ['limit', 'cursor'].includes(key)))
    return null;
  const { limit, cursor } = query;
  const pageSize = parseLimit(limit);
  if (pageSize === null) return null;
  const position = cursor === undefined ? undefined : parseCursor(cursor);
  if (position === null) return null;
  return { pageSize, position };
}

/** @param {import('./message-storage.js').Message} message */
export function messageCursor(message) {
  return `${message.createdAt.toISOString()}~${message._id.toHexString()}`;
}
