import { ObjectId } from 'mongodb';
import {
  validInvitationMessage,
  invitationPairKey,
} from './invitation-policy.js';
import { logAccountFailure } from './safe-logging.js';

/** @param {unknown} body @returns {body is {recipientId: string, message: string}} */
function validCreation(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const input = /** @type {{recipientId?: unknown, message?: unknown}} */ (
    body
  );
  return (
    Object.keys(body).every((key) =>
      ['recipientId', 'message'].includes(key),
    ) &&
    typeof input.recipientId === 'string' &&
    /^[a-f0-9]{24}$/.test(input.recipientId) &&
    validInvitationMessage(input.message)
  );
}

/** Serialize explicitly: internal pair keys never belong in API responses.
 * @param {import('./invitation-policy.js').Invitation} invitation
 */
export function publicInvitation(invitation) {
  return {
    id: invitation._id.toHexString(),
    senderId: invitation.senderId.toHexString(),
    recipientId: invitation.recipientId.toHexString(),
    message: invitation.message,
    status: invitation.status,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
    respondedAt: invitation.respondedAt?.toISOString() ?? null,
  };
}

/** Mount behind requireAccount and the creation limiter.
 * @type {import('express').RequestHandler}
 */
export async function createInvitation(request, response) {
  response.set('Cache-Control', 'no-store');
  if (!validCreation(request.body)) {
    response.status(400).json({
      error:
        'Provide only a valid recipient ID and a message of 1–5000 characters.',
    });
    return;
  }
  const recipientId = new ObjectId(request.body.recipientId);
  const senderId = /** @type {ObjectId} */ (response.locals.accountId);
  if (recipientId.equals(senderId)) {
    response.status(400).json({ error: 'You cannot invite yourself.' });
    return;
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  try {
    if (!db) throw new Error('Invitation storage unavailable.');
    const recipient = await db
      .collection('users')
      .findOne({ _id: recipientId }, { projection: { _id: 1 } });
    if (!recipient) {
      response.status(404).json({ error: 'No matching recipient found.' });
      return;
    }
    const now = new Date();
    /** @type {import('./invitation-policy.js').Invitation} */
    const invitation = {
      _id: new ObjectId(),
      senderId,
      recipientId,
      pairKey: invitationPairKey(senderId, recipientId),
      message: request.body.message.trim(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      respondedAt: null,
    };
    await db.collection('invitations').insertOne(invitation);
    response.status(201).json({ invitation: publicInvitation(invitation) });
  } catch (failure) {
    if (
      failure instanceof Error &&
      'code' in failure &&
      failure.code === 11000
    ) {
      response.status(409).json({
        error: 'An invitation already exists between these accounts.',
      });
      return;
    }
    logAccountFailure(request, 'invitation-create', failure);
    response
      .status(503)
      .json({ error: 'Invitation creation is temporarily unavailable.' });
  }
}
