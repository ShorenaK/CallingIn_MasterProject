import { counterpartTitle, formatDate, statusLabel } from './format.js';

/** @param {{direction: import('./api.js').Direction, invitation: import('./api.js').Invitation}} props */
export function InvitationCard({ direction, invitation }) {
  const label = statusLabel(direction, invitation.status);
  const titleId = `invitation-${invitation.id}-title`;
  return (
    <article className="invitation-card" aria-labelledby={titleId}>
      <h4 id={titleId}>{counterpartTitle(direction, invitation)}</h4>
      <p className={`status-label status-${invitation.status}`}>
        <span aria-hidden="true">{label.symbol}</span> {label.text}
      </p>
      <p className="invitation-message">{invitation.message}</p>
      <p className="invitation-date">
        Sent{' '}
        <time dateTime={invitation.createdAt}>
          {formatDate(invitation.createdAt)}
        </time>
      </p>
      {invitation.status === 'accepted' && (
        <p className="field-hint">
          Private conversations are coming in a future update.
        </p>
      )}
    </article>
  );
}
