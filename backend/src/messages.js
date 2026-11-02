import { ObjectId } from 'mongodb';
import { parseMessageQuery, messageCursor } from './message-pagination.js';
import { logAccountFailure } from './safe-logging.js';

/** @param {unknown} body @returns {body is {text: string}} */
function validMessage(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const input = /** @type {{text?: unknown}} */ (body);
  return (
    Object.keys(body).length === 1 &&
    typeof input.text === 'string' &&
    input.text.trim().length >= 1 &&
    input.text.trim().length <= 5000
  );
}

/** @param {import('./message-storage.js').Message} message */
function publicMessage(message) {
  return {
    id: message._id.toHexString(),
    conversationId: message.conversationId.toHexString(),
    senderId: message.senderId.toHexString(),
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
}

/** Every call follows verified-account and conversation-participant checks.
 * @type {import('express').RequestHandler}
 */
export async function sendMessage(request, response) {
  if (!validMessage(request.body)) {
    response
      .status(400)
      .json({ error: 'Provide only text of 1–5000 characters.' });
    return;
  }
  try {
    /** @type {import('./message-storage.js').Message} */
    const message = {
      _id: new ObjectId(),
      conversationId: response.locals.conversationId,
      senderId: response.locals.accountId,
      text: request.body.text.trim(),
      createdAt: new Date(),
    };
    await request.app.locals.db.collection('messages').insertOne(message);
    response.status(201).json({ message: publicMessage(message) });
  } catch (failure) {
    logAccountFailure(request, 'message-send', failure);
    response
      .status(503)
      .json({ error: 'Message sending is temporarily unavailable.' });
  }
}

/** Newest first; cursors never replace the authorized conversation filter.
 * @type {import('express').RequestHandler}
 */
export async function listMessages(request, response) {
  const query = parseMessageQuery(request.query);
  if (!query) {
    response
      .status(400)
      .json({ error: 'Provide an optional limit of 1–50 and a valid cursor.' });
    return;
  }
  /** @type {import('mongodb').Filter<import('./message-storage.js').Message>} */
  const filter = { conversationId: response.locals.conversationId };
  if (query.position) {
    const { createdAt, id } = query.position;
    filter.$or = [
      { createdAt: { $lt: createdAt } },
      { createdAt, _id: { $lt: id } },
    ];
  }
  try {
    const records = await request.app.locals.db
      .collection('messages')
      .find(filter, {
        projection: {
          _id: 1,
          conversationId: 1,
          senderId: 1,
          text: 1,
          createdAt: 1,
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.pageSize + 1)
      .toArray();
    const messages = /** @type {import('./message-storage.js').Message[]} */ (
      records.slice(0, query.pageSize)
    );
    response.json({
      messages: messages.map(publicMessage),
      nextCursor:
        records.length > query.pageSize
          ? messageCursor(messages[messages.length - 1])
          : null,
    });
  } catch (failure) {
    logAccountFailure(request, 'message-list', failure);
    response
      .status(503)
      .json({ error: 'Message history is temporarily unavailable.' });
  }
}
