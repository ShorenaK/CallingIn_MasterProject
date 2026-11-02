import { useEffect, useRef, useState } from 'react';
import { counterpartTitle, formatDate, statusLabel } from './format.js';
import { InvitationResponse } from './InvitationResponse.jsx';

/**
 * @typedef {object} CardActions
 * @property {(updated: import('./api.js').Invitation) => void} update
 * @property {() => void} refresh
 * @property {() => void} onSessionExpired
 */

/** @param {{direction: import('./api.js').Direction, invitation: import('./api.js').Invitation, actions: CardActions, focusOnMount?: boolean}} props */
export function InvitationCard({
  direction,
  invitation,
  actions,
  focusOnMount = false,
}) {
  const label = statusLabel(direction, invitation.status);
  const titleId = `invitation-${invitation.id}-title`;
  const personLabel = counterpartTitle(direction, invitation);
  const title = useRef(/** @type {HTMLHeadingElement | null} */ (null));
  const status = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  const [responded, setResponded] = useState(false);
  // Newly loaded pages move focus to their first card, not back to the top.
  useEffect(() => {
    if (focusOnMount) title.current?.focus();
  }, [focusOnMount]);
  // After a response, the updated status is read out where the buttons were.
  useEffect(() => {
    if (responded) status.current?.focus();
  }, [responded, invitation.status]);
  const canRespond =
    direction === 'incoming' &&
    (invitation.status === 'pending' || invitation.status === 'deferred');
  return (
    <article className="invitation-card" aria-labelledby={titleId}>
      <h4 id={titleId} ref={title} tabIndex={-1}>
        {personLabel}
      </h4>
      <p
        className={`status-label status-${invitation.status}`}
        ref={status}
        tabIndex={-1}
      >
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
      {canRespond && (
        <InvitationResponse
          invitation={invitation}
          personLabel={personLabel}
          onResponded={(updated) => {
            actions.update(updated);
            setResponded(true);
          }}
          onRefresh={actions.refresh}
          onSessionExpired={actions.onSessionExpired}
        />
      )}
    </article>
  );
}
