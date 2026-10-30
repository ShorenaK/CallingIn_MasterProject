import { InvitationCard } from './InvitationCard.jsx';
import { Problem } from './Problem.jsx';
import { useInvitationList } from './useInvitationList.js';

const LIST_COPY = {
  incoming: {
    title: 'Received',
    loading: 'Loading received invitations…',
    empty: 'No invitations yet. When someone invites you, it will appear here.',
    more: 'Show more received',
  },
  outgoing: {
    title: 'Sent',
    loading: 'Loading sent invitations…',
    empty: 'You haven’t sent any invitations yet.',
    more: 'Show more sent',
  },
};

/** @param {{direction: import('./api.js').Direction, onSessionExpired: () => void}} props */
export function InvitationList({ direction, onSessionExpired }) {
  const list = useInvitationList(direction, onSessionExpired);
  const copy = LIST_COPY[direction];
  return (
    <section
      className="invitation-panel"
      aria-labelledby={`${direction}-title`}
    >
      <h3 id={`${direction}-title`}>{copy.title}</h3>
      {list.status === 'loading' && <p role="status">{copy.loading}</p>}
      {list.status === 'error' && (
        <Problem message={list.error} onRetry={list.retry} />
      )}
      {list.status === 'ready' && list.invitations.length === 0 && (
        <p className="empty-state">{copy.empty}</p>
      )}
      {list.invitations.length > 0 && (
        <ul className="invitation-list">
          {list.invitations.map((invitation) => (
            <li key={invitation.id}>
              <InvitationCard
                direction={direction}
                invitation={invitation}
                focusOnMount={invitation.id === list.more.focusId}
              />
            </li>
          ))}
        </ul>
      )}
      <MoreControls list={list} label={copy.more} />
    </section>
  );
}

/** @param {{list: ReturnType<typeof useInvitationList>, label: string}} props */
function MoreControls({ list, label }) {
  const { more } = list;
  return (
    <>
      {/* Present before it changes so screen readers announce each load. */}
      <p className="visually-hidden" role="status">
        {more.announcement}
      </p>
      {more.status === 'error' && (
        <Problem message={more.error} onRetry={list.loadMore} />
      )}
      {list.nextCursor && more.status !== 'error' && (
        <button
          type="button"
          className="secondary-button"
          disabled={more.status === 'loading'}
          onClick={list.loadMore}
        >
          {more.status === 'loading' ? 'Loading…' : label}
        </button>
      )}
    </>
  );
}
