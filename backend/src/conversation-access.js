import { ObjectId } from 'mongodb';
import { logAccountFailure } from './safe-logging.js';

/** Mount behind requireAccount; outsiders and missing rooms share a 404.
 * @type {import('express').RequestHandler}
 */
export async function requireConversation(request, response, next) {
  response.set('Cache-Control', 'no-store');
  const id = request.params.id;
  if (typeof id !== 'string' || !/^[a-f0-9]{24}$/.test(id)) {
    response.status(400).json({ error: 'Provide a valid conversation ID.' });
    return;
  }
  try {
    /** @type {import('mongodb').Db | undefined} */
    const db = request.app.locals.db;
    if (!db) throw new Error('Conversation storage unavailable.');
    const conversationId = new ObjectId(id);
    const room = await db.collection('conversations').findOne(
      {
        _id: conversationId,
        participantIds: response.locals.accountId,
      },
      { projection: { _id: 1 } },
    );
    if (!room) {
      response.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    response.locals.conversationId = conversationId;
    next();
  } catch (failure) {
    logAccountFailure(request, 'conversation-access', failure);
    response
      .status(503)
      .json({ error: 'Conversations are temporarily unavailable.' });
  }
}
