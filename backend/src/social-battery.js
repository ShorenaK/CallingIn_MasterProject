import { logAccountFailure } from './safe-logging.js';

const statuses = new Set(['open', 'busy', 'space']);

/** @param {unknown} value */
function publicStatus(value) {
  return typeof value === 'string' && statuses.has(value) ? value : null;
}

/** @type {import('express').RequestHandler} */
export async function readBattery(request, response) {
  try {
    const user = await request.app.locals.db
      .collection('users')
      .findOne(
        { _id: response.locals.accountId },
        { projection: { socialBattery: 1 } },
      );
    if (!user)
      return response.status(401).json({ error: 'Sign in to continue.' });
    return response.json({ status: publicStatus(user.socialBattery) });
  } catch (failure) {
    return unavailable(request, response, failure);
  }
}

/** Only the verified session account can be updated; no client account ID.
 * @type {import('express').RequestHandler}
 */
export async function saveBattery(request, response) {
  const body = request.body;
  if (!validUpdate(body))
    return response
      .status(400)
      .json({ error: 'Choose only a valid Social Battery status.' });
  try {
    const user = await request.app.locals.db
      .collection('users')
      .findOneAndUpdate(
        { _id: response.locals.accountId },
        { $set: { socialBattery: body.status } },
        { returnDocument: 'after', projection: { socialBattery: 1 } },
      );
    if (!user)
      return response.status(401).json({ error: 'Sign in to continue.' });
    return response.json({ status: publicStatus(user.socialBattery) });
  } catch (failure) {
    return unavailable(request, response, failure);
  }
}

/** Mounted behind requireConversation: rooms originate from accepted invitations.
 * Read only the other participant's status; never expose account details.
 * @type {import('express').RequestHandler}
 */
export async function readPartnerBattery(request, response) {
  try {
    const db = request.app.locals.db;
    const room = await db.collection('conversations').findOne(
      {
        _id: response.locals.conversationId,
        participantIds: response.locals.accountId,
      },
      { projection: { participantIds: 1 } },
    );
    if (!room)
      return response.status(404).json({ error: 'Conversation not found.' });
    const partnerId = room.participantIds.find(
      (/** @type {import('mongodb').ObjectId} */ id) =>
        !id.equals(response.locals.accountId),
    );
    const partner = await db
      .collection('users')
      .findOne({ _id: partnerId }, { projection: { socialBattery: 1 } });
    return response.json({ status: publicStatus(partner?.socialBattery) });
  } catch (failure) {
    return unavailable(request, response, failure);
  }
}

/** @param {unknown} body @returns {body is {status: string}} */
function validUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const input = /** @type {{status?: unknown}} */ (body);
  return Object.keys(input).length === 1 && publicStatus(input.status) !== null;
}

/** @param {import('express').Request} request @param {import('express').Response} response @param {unknown} failure */
function unavailable(request, response, failure) {
  logAccountFailure(request, 'social-battery', failure);
  return response
    .status(503)
    .json({ error: 'Social Battery is temporarily unavailable.' });
}
