import { useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage } from '../account/api.js';
import { listInvitations } from './api.js';

/**
 * @typedef {object} ListState
 * @property {'loading' | 'ready' | 'error'} status
 * @property {import('./api.js').Invitation[]} invitations
 * @property {string | null} nextCursor
 * @property {string} error
 */

/**
 * @typedef {object} MoreState
 * @property {'idle' | 'loading' | 'error'} status
 * @property {string} error
 * @property {string | null} focusId First newly loaded card, focused on arrival.
 * @property {string} announcement
 */

/** @type {ListState} */
const initialState = {
  status: 'loading',
  invitations: [],
  nextCursor: null,
  error: '',
};

/** @type {MoreState} */
const initialMore = {
  status: 'idle',
  error: '',
  focusId: null,
  announcement: '',
};

/** @param {unknown} failure */
function sessionExpired(failure) {
  return failure instanceof ApiError && failure.status === 401;
}

/**
 * @param {import('./api.js').Direction} direction
 * @param {() => void} onSessionExpired Must be stable between renders.
 */
export function useInvitationList(direction, onSessionExpired) {
  const [state, setState] = useState(initialState);
  const [attempt, setAttempt] = useState(0);
  const [more, setMore] = useState(initialMore);
  const generation = useRef(0);
  useEffect(
    () =>
      startFirstPageRequest(direction, onSessionExpired, setState, generation),
    [direction, attempt, onSessionExpired],
  );

  function retry() {
    generation.current += 1;
    setState(initialState);
    setMore(initialMore);
    setAttempt((value) => value + 1);
  }

  async function loadMore() {
    const cursor = state.nextCursor;
    const version = generation.current;
    if (!cursor || more.status === 'loading') return;
    setMore({ ...initialMore, status: 'loading' });
    try {
      const page = await listInvitations(direction, cursor);
      if (version !== generation.current) return;
      setState((current) => appendPage(current, page));
      setMore({
        ...initialMore,
        focusId: page.invitations[0]?.id ?? null,
        announcement: loadedMessage(page.invitations.length),
      });
    } catch (failure) {
      if (version !== generation.current) return;
      if (sessionExpired(failure)) onSessionExpired();
      else
        setMore({
          ...initialMore,
          status: 'error',
          error: errorMessage(failure),
        });
    }
  }
  /** @param {import('./api.js').Invitation} updated */
  function update(updated) {
    setState((current) => replaceInvitation(current, updated));
  }
  return { ...state, more, retry, loadMore, update };
}

/** Start a first-page request and invalidate all older pagination on cleanup.
 * @param {import('./api.js').Direction} direction
 * @param {() => void} onSessionExpired
 * @param {import('react').Dispatch<import('react').SetStateAction<ListState>>} setState
 * @param {import('react').RefObject<number>} generation
 */
function startFirstPageRequest(
  direction,
  onSessionExpired,
  setState,
  generation,
) {
  const version = ++generation.current;
  listInvitations(direction)
    .then((page) => {
      if (version === generation.current)
        setState({ status: 'ready', error: '', ...page });
    })
    .catch((failure) => {
      if (version !== generation.current) return;
      if (sessionExpired(failure)) onSessionExpired();
      else
        setState({
          ...initialState,
          status: 'error',
          error: errorMessage(failure),
        });
    });
  return () => {
    generation.current += 1;
  };
}

/**
 * Response payloads omit the counterpart name; keep the one from the list.
 * @param {ListState} current
 * @param {import('./api.js').Invitation} updated
 * @returns {ListState}
 */
function replaceInvitation(current, updated) {
  return {
    ...current,
    invitations: current.invitations.map((item) =>
      item.id === updated.id
        ? { ...item, ...updated, otherPerson: item.otherPerson }
        : item,
    ),
  };
}

/**
 * Cursor pages should not overlap; skipping repeats keeps list keys unique.
 * @param {ListState} current
 * @param {import('./api.js').InvitationPage} page
 * @returns {ListState}
 */
function appendPage(current, page) {
  const seen = new Set(current.invitations.map((item) => item.id));
  return {
    ...current,
    invitations: [
      ...current.invitations,
      ...page.invitations.filter((item) => !seen.has(item.id)),
    ],
    nextCursor: page.nextCursor,
  };
}

/** @param {number} count */
function loadedMessage(count) {
  if (count === 0) return 'No more invitations to show.';
  return `Loaded ${count} more ${count === 1 ? 'invitation' : 'invitations'}.`;
}
