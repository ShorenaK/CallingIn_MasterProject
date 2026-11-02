import { ObjectId } from 'mongodb';
import { publicInvitation } from './invitation-creation.js';
import { logAccountFailure } from './safe-logging.js';

/** @param {unknown} body @returns {body is {status: 'accepted' | 'deferred' | 'declined'}} */
function validResponse(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return (
    Object.keys(body).length === 1 &&
    ['accepted', 'deferred', 'declined'].includes(
      /** @type {{status: string}} */ (body).status,
    )
  );
}

/** Mount behind requireAccount and trusted-origin/JSON protection.
 * @type {import('express').RequestHandler}
 */
export async function respondToInvitation(request, response) {
  response.set('Cache-Control', 'no-store');
  const id = request.params.id;
  if (
    typeof id !== 'string' ||
    !/^[a-f0-9]{24}$/.test(id) ||
    !validResponse(request.body)
  ) {
    response.status(400).json({
      error:
        'Provide a valid invitation ID and only an accepted, deferred, or declined status.',
    });
    return;
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  try {
    if (!db) throw new Error('Invitation storage unavailable.');
    const collection =
      /** @type {import('mongodb').Collection<import('./invitation-policy.js').Invitation>} */ (
        db.collection('invitations')
      );
    const identity = {
      _id: new ObjectId(id),
      recipientId: response.locals.accountId,
    };
    const status = request.body.status;
    const now = new Date();
    // Excluding the requested state makes retries read-only. A terminal response
    // cannot match this filter, even if two final decisions arrive together.
    /** @type {import('./invitation-policy.js').InvitationStatus[]} */
    const allowed =
      status === 'deferred' ? ['pending'] : ['pending', 'deferred'];
    const updated = await collection.findOneAndUpdate(
      { ...identity, status: { $in: allowed } },
      { $set: { status, updatedAt: now, respondedAt: now } },
      { returnDocument: 'after' },
    );
    if (updated) {
      response.json({ invitation: publicInvitation(updated) });
      return;
    }
    const current = await collection.findOne(identity);
    if (!current) {
      response.status(404).json({ error: 'Invitation not found.' });
      return;
    }
    if (current.status === status) {
      response.json({ invitation: publicInvitation(current) });
      return;
    }
    response
      .status(409)
      .json({ error: 'This invitation already has a final response.' });
  } catch (failure) {
    logAccountFailure(request, 'invitation-response', failure);
    response
      .status(503)
      .json({ error: 'Invitation responses are temporarily unavailable.' });
  }
}
