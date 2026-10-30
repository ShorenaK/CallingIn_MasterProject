import { InvitationList } from './InvitationList.jsx';

/** @param {{onSessionExpired: () => void}} props */
export function Invitations({ onSessionExpired }) {
  return (
    <section className="invitations" aria-labelledby="invitations-title">
      <p className="eyebrow">Conversation invitations</p>
      <h2 id="invitations-title">Invitations</h2>
      <p className="invitations-intro">
        You decide who to invite and how to respond. Accepting records your
        consent to connect; private conversations are coming in a future update.
      </p>
      <div className="invitation-columns">
        <InvitationList
          direction="incoming"
          onSessionExpired={onSessionExpired}
        />
        <InvitationList
          direction="outgoing"
          onSessionExpired={onSessionExpired}
        />
      </div>
    </section>
  );
}
