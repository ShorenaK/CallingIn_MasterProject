import { Conversation } from '../conversations/Conversation.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InvitationList } from './InvitationList.jsx';
import { SendInvitation } from './SendInvitation.jsx';

/** @param {{userId: string, onSessionExpired: () => void}} props */
export function Invitations({ userId, onSessionExpired }) {
  // Bumped after a successful send so the Sent list shows the new invitation.
  const [sentVersion, setSentVersion] = useState(0);
  const [selected, setSelected] = useState(
    /** @type {import('./api.js').Invitation | null} */ (null),
  );
  const [expired, setExpired] = useState(false);
  const opener = useRef(/** @type {HTMLElement | null} */ (null));
  const expire = useCallback(() => setExpired(true), []);
  useEffect(() => {
    if (expired && !selected) onSessionExpired();
  }, [expired, selected, onSessionExpired]);
  useEffect(() => {
    if (!selected) opener.current?.focus();
  }, [selected]);
  /** @param {import('./api.js').Invitation} invitation */
  function open(invitation) {
    opener.current = /** @type {HTMLElement | null} */ (document.activeElement);
    setSelected(invitation);
  }
  return (
    <section className="invitations" aria-labelledby="invitations-title">
      <p className="eyebrow">Conversation invitations</p>
      <h2 id="invitations-title">Invitations</h2>
      {selected && (
        <Conversation
          key={selected.id}
          invitation={selected}
          userId={userId}
          expired={expired}
          onExpired={expire}
          onSignIn={onSessionExpired}
          onBack={() => setSelected(null)}
        />
      )}
      <div hidden={Boolean(selected)}>
        <p className="invitations-intro">
          You decide who to invite and how to respond. After an invitation is
          accepted, either participant can open a private conversation.
        </p>
        <SendInvitation
          onSent={() => setSentVersion((value) => value + 1)}
          onSessionExpired={expire}
        />
        <div className="invitation-columns">
          <InvitationList
            onOpenConversation={open}
            direction="incoming"
            onSessionExpired={expire}
          />
          {/* A successful send starts a fresh Sent list and pagination lifecycle. */}
          <InvitationList
            key={sentVersion}
            onOpenConversation={open}
            direction="outgoing"
            onSessionExpired={expire}
          />
        </div>
      </div>
    </section>
  );
}
