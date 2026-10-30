/**
 * Status wording per viewpoint. Each label pairs a text description with a
 * shape so status is never communicated by color alone.
 * @type {Record<import('./api.js').Direction, Record<import('./api.js').InvitationStatus, {symbol: string, text: string}>>}
 */
const STATUS_LABELS = {
  incoming: {
    pending: { symbol: '●', text: 'Waiting for your reply' },
    deferred: { symbol: '◐', text: 'You chose Maybe Later' },
    accepted: { symbol: '✓', text: 'You accepted' },
    declined: { symbol: '○', text: 'You chose I need some space' },
  },
  outgoing: {
    pending: { symbol: '●', text: 'Waiting for a reply' },
    deferred: { symbol: '◐', text: 'They chose Maybe Later' },
    accepted: { symbol: '✓', text: 'Accepted' },
    declined: { symbol: '○', text: 'Closed — they need some space' },
  },
};

/**
 * @param {import('./api.js').Direction} direction
 * @param {import('./api.js').InvitationStatus} status
 */
export function statusLabel(direction, status) {
  return STATUS_LABELS[direction][status];
}

/**
 * @param {import('./api.js').Direction} direction
 * @param {import('./api.js').Invitation} invitation
 */
export function counterpartTitle(direction, invitation) {
  const name = invitation.otherPerson?.displayName;
  if (!name) return 'Account unavailable';
  return direction === 'incoming' ? `From ${name}` : `To ${name}`;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** @param {string} isoDate */
export function formatDate(isoDate) {
  return dateFormat.format(new Date(isoDate));
}
