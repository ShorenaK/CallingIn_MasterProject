import { useState } from 'react';
import { InvitationList } from './InvitationList.jsx';
import { SendInvitation } from './SendInvitation.jsx';

/** @param {{onSessionExpired: () => void}} props */
export function Invitations({ onSessionExpired }) {
  // Bumped after a successful send so the Sent list shows the new invitation.
  const [sentVersion, setSentVersion] = useState(0);
  return (
    <section className="invitations" aria-labelledby="invitations-title">
      <p className="eyebrow">Conversation invitations</p>
      <h2 id="invitations-title">Invitations</h2>
      <p className="invitations-intro">
        You decide who to invite and how to respond. Accepting records your
        consent to connect; private conversations are coming in a future update.
      </p>
      <SendInvitation
        onSent={() => setSentVersion((value) => value + 1)}
        onSessionExpired={onSessionExpired}
      />
      <div className="invitation-columns">
        <InvitationList
          direction="incoming"
          onSessionExpired={onSessionExpired}
        />
        <InvitationList
          direction="outgoing"
          onSessionExpired={onSessionExpired}
          reloadKey={sentVersion}
        />
      </div>
    </section>
  );
}
