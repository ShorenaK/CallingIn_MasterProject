import {
  parseInvitationQuery,
  invitationCursor,
} from './invitation-pagination.js';
import { invitationsWithNames } from './invitation-participants.js';
import { logAccountFailure } from './safe-logging.js';

const invitationProjection = {
  _id: 1,
  senderId: 1,
  recipientId: 1,
  message: 1,
  status: 1,
  createdAt: 1,
  updatedAt: 1,
  respondedAt: 1,
};

/** Mount behind requireAccount. Caller-supplied cursors never replace identity.
 * @type {import('express').RequestHandler}
 */
export async function listInvitations(request, response) {
  response.set('Cache-Control', 'no-store');
  const query = parseInvitationQuery(request.query);
  if (!query) {
    response.status(400).json({
      error:
        'Provide incoming or outgoing direction, an optional limit of 1–50, and a valid cursor.',
    });
    return;
  }
  const participant =
    query.direction === 'incoming' ? 'recipientId' : 'senderId';
  /** @type {import('mongodb').Filter<import('./invitation-policy.js').Invitation>} */
  const filter = { [participant]: response.locals.accountId };
  if (query.position) {
    const { createdAt, id } = query.position;
    filter.$or = [
      { createdAt: { $lt: createdAt } },
      { createdAt, _id: { $lt: id } },
    ];
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  try {
    if (!db) throw new Error('Invitation storage unavailable.');
    const collection =
      /** @type {import('mongodb').Collection<import('./invitation-policy.js').Invitation>} */ (
        db.collection('invitations')
      );
    const records = await collection
      .find(filter, { projection: invitationProjection })
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.pageSize + 1)
      .toArray();
    const invitations =
      /** @type {import('./invitation-policy.js').Invitation[]} */ (
        records.slice(0, query.pageSize)
      );
    const hasMore = records.length > query.pageSize;
    response.json({
      invitations: await invitationsWithNames(db, invitations, query.direction),
      nextCursor: hasMore
        ? invitationCursor(invitations[invitations.length - 1])
        : null,
    });
  } catch (failure) {
    logAccountFailure(request, 'invitation-list', failure);
    response
      .status(503)
      .json({ error: 'Invitation lists are temporarily unavailable.' });
  }
}
