import { ObjectId } from 'mongodb';
import { logAccountFailure } from './safe-logging.js';

/** @param {unknown} body */
function emptyBody(body) {
  return (
    body === undefined ||
    (body !== null &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      Object.keys(body).length === 0)
  );
}

/** A unique invitation index makes simultaneous opens converge on one room.
 * @param {import('mongodb').Db} db
 * @param {import('./invitation-policy.js').Invitation} invitation
 */
async function ensureConversation(db, invitation) {
  const rooms =
    /** @type {import('mongodb').Collection<import('./conversation-storage.js').Conversation>} */ (
      db.collection('conversations')
    );
  const identity = { invitationId: invitation._id };
  try {
    const room = await rooms.findOneAndUpdate(
      identity,
      {
        $setOnInsert: {
          participantIds: [invitation.senderId, invitation.recipientId],
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' },
    );
    if (!room) throw new Error('Conversation upsert returned no record.');
    return room;
  } catch (failure) {
    // Another upsert can win the unique-index race. Only return its saved room.
    if (
      !(failure instanceof Error) ||
      !('code' in failure) ||
      failure.code !== 11000
    )
      throw failure;
    const room = await rooms.findOne(identity);
    if (!room) throw failure;
    return room;
  }
}

/** Mount behind verified-account and trusted-origin/JSON protections.
 * @type {import('express').RequestHandler}
 */
export async function openConversation(request, response) {
  response.set('Cache-Control', 'no-store');
  const id = request.params.id;
  if (
    typeof id !== 'string' ||
    !/^[a-f0-9]{24}$/.test(id) ||
    !emptyBody(request.body)
  ) {
    response
      .status(400)
      .json({ error: 'Provide a valid invitation ID and an empty body.' });
    return;
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  try {
    if (!db) throw new Error('Conversation storage unavailable.');
    const accountId = response.locals.accountId;
    const invitations =
      /** @type {import('mongodb').Collection<import('./invitation-policy.js').Invitation>} */ (
        db.collection('invitations')
      );
    const invitation = await invitations.findOne({
      _id: new ObjectId(id),
      $or: [{ senderId: accountId }, { recipientId: accountId }],
    });
    if (!invitation) {
      response.status(404).json({ error: 'Invitation not found.' });
      return;
    }
    if (invitation.status !== 'accepted') {
      response.status(409).json({
        error: 'Accept the invitation before opening a conversation.',
      });
      return;
    }
    const room = await ensureConversation(db, invitation);
    response.json({
      conversation: {
        id: room._id.toHexString(),
        invitationId: room.invitationId.toHexString(),
        participantIds: room.participantIds.map((participant) =>
          participant.toHexString(),
        ),
        createdAt: room.createdAt.toISOString(),
      },
    });
  } catch (failure) {
    logAccountFailure(request, 'conversation-open', failure);
    response
      .status(503)
      .json({ error: 'Conversations are temporarily unavailable.' });
  }
}
