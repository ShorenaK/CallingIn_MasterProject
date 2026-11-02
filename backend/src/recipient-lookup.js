import { validEmail } from './account-policy.js';
import { logAccountFailure } from './safe-logging.js';

/** @param {unknown} body @returns {body is {email: string}} */
function validLookup(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return (
    Object.keys(body).length === 1 &&
    validEmail(/** @type {{email?: unknown}} */ (body).email)
  );
}

/** Mount behind requireAccount and the account-keyed lookup limiter.
 * @type {import('express').RequestHandler}
 */
export async function lookupRecipient(request, response) {
  response.set('Cache-Control', 'no-store');
  if (!validLookup(request.body)) {
    response.status(400).json({ error: 'Provide only a valid email address.' });
    return;
  }
  /** @type {import('mongodb').Db | undefined} */
  const db = request.app.locals.db;
  try {
    if (!db) throw new Error('Account storage unavailable.');
    const user = await db
      .collection('users')
      .findOne(
        { email: request.body.email.trim().toLowerCase() },
        { projection: { _id: 1, displayName: 1 } },
      );
    if (!user || user._id.equals(response.locals.accountId)) {
      response.status(404).json({ error: 'No matching recipient found.' });
      return;
    }
    response.json({
      user: { id: user._id.toHexString(), displayName: user.displayName },
    });
  } catch (failure) {
    logAccountFailure(request, 'recipient-lookup', failure);
    response
      .status(503)
      .json({ error: 'Recipient lookup is temporarily unavailable.' });
  }
}
