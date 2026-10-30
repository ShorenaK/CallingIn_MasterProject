import { useEffect, useRef } from 'react';
import { counterpartTitle, formatDate, statusLabel } from './format.js';

/** @param {{direction: import('./api.js').Direction, invitation: import('./api.js').Invitation, focusOnMount?: boolean}} props */
export function InvitationCard({
  direction,
  invitation,
  focusOnMount = false,
}) {
  const label = statusLabel(direction, invitation.status);
  const titleId = `invitation-${invitation.id}-title`;
  const title = useRef(/** @type {HTMLHeadingElement | null} */ (null));
  // Newly loaded pages move focus to their first card, not back to the top.
  useEffect(() => {
    if (focusOnMount) title.current?.focus();
  }, [focusOnMount]);
  return (
    <article className="invitation-card" aria-labelledby={titleId}>
      <h4 id={titleId} ref={title} tabIndex={-1}>
        {counterpartTitle(direction, invitation)}
      </h4>
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
