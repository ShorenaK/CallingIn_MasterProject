import { publicInvitation } from './invitation-creation.js';

/**
 * Fetch only counterpart names for this authorized page, never a user directory.
 * @param {import('mongodb').Db} db
 * @param {import('./invitation-policy.js').Invitation[]} invitations
 * @param {string} direction
 */
export async function invitationsWithNames(db, invitations, direction) {
  if (invitations.length === 0) return [];
  const counterpart = direction === 'incoming' ? 'senderId' : 'recipientId';
  const ids = new Map(
    invitations.map((invitation) => {
      const id = invitation[counterpart];
      return [id.toHexString(), id];
    }),
  );
  const people = await db
    .collection('users')
    .find(
      { _id: { $in: [...ids.values()] } },
      { projection: { _id: 1, displayName: 1 } },
    )
    .toArray();
  const names = new Map(
    people.map((person) => [person._id.toHexString(), person.displayName]),
  );
  return invitations.map((invitation) => {
    const name = names.get(invitation[counterpart].toHexString());
    return {
      ...publicInvitation(invitation),
      otherPerson: typeof name === 'string' ? { displayName: name } : null,
    };
  });
}
