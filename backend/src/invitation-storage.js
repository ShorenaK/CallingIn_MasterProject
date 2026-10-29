/**
 * Permanent pair uniqueness enforces the approved Sprint 3 contact policy.
 * Participant/time/ID indexes support stable newest-first cursor pagination.
 * No TTL index: invitations must not silently expire or lose consent history.
 * @param {import('mongodb').Db} db
 */
export async function prepareInvitations(db) {
  const invitations = db.collection('invitations');
  await invitations.createIndex(
    { pairKey: 1 },
    { unique: true, name: 'invitation_pair_unique' },
  );
  await invitations.createIndex(
    { recipientId: 1, createdAt: -1, _id: -1 },
    { name: 'invitation_incoming' },
  );
  await invitations.createIndex(
    { senderId: 1, createdAt: -1, _id: -1 },
    { name: 'invitation_outgoing' },
  );
}
