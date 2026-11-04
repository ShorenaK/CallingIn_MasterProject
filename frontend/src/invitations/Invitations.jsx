import { useAccountNavigation } from './useAccountNavigation.js';
import { Conversation } from '../conversations/Conversation.jsx';
import { useCallback, useEffect, useState } from 'react';
import { InvitationList } from './InvitationList.jsx';
import { SendInvitation } from './SendInvitation.jsx';

/** @param {{userId: string, onSessionExpired: () => void, navigationRef: import('./useAccountNavigation.js').NavigationRef, onGoToAccount: () => void}} props */
export function Invitations({
  userId,
  onSessionExpired,
  navigationRef,
  onGoToAccount,
}) {
  // Bumped after a successful send so the Sent list shows the new invitation.
  const [sentVersion, setSentVersion] = useState(0);
  const [selected, setSelected] = useState(
    /** @type {import('./api.js').Invitation | null} */ (null),
  );
  const [expired, setExpired] = useState(false);
  const navigation = useAccountNavigation({
    navigationRef,
    selected,
    setSelected,
    onGoToAccount,
  });
  const expire = useCallback(() => setExpired(true), []);
  useEffect(() => {
    if (expired && !selected) onSessionExpired();
  }, [expired, selected, onSessionExpired]);
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
          accountNavigation={navigation.conversationNavigation}
          onGoToAccount={navigation.goToAccount}
        />
      )}
      <div hidden={Boolean(selected)}>
        <p className="invitations-intro">
          You decide who to invite and how to respond. After an invitation is
          accepted, either participant can open a private conversation.
        </p>
        <SendInvitation
          active={!selected}
          onSent={() => setSentVersion((value) => value + 1)}
          onSessionExpired={expire}
        />
        <InvitationLists
          onOpenConversation={navigation.open}
          onSessionExpired={expire}
          sentVersion={sentVersion}
        />
      </div>
    </section>
  );
}

/** @param {{onOpenConversation: (invitation: import('./api.js').Invitation) => void, onSessionExpired: () => void, sentVersion: number}} props */
function InvitationLists({
  onOpenConversation,
  onSessionExpired,
  sentVersion,
}) {
  return (
    <div className="invitation-columns">
      <InvitationList
        onOpenConversation={onOpenConversation}
        direction="incoming"
        onSessionExpired={onSessionExpired}
      />
      {/* A successful send starts a fresh Sent list and pagination lifecycle. */}
      <InvitationList
        key={sentVersion}
        onOpenConversation={onOpenConversation}
        direction="outgoing"
        onSessionExpired={onSessionExpired}
      />
    </div>
  );
}
