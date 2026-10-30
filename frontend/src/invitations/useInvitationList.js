import { useEffect, useState } from 'react';
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
 * @param {number} [reloadKey] Changing it reloads the first page.
 */
export function useInvitationList(direction, onSessionExpired, reloadKey = 0) {
  const [state, setState] = useState(initialState);
  const [attempt, setAttempt] = useState(0);
  const [more, setMore] = useState(initialMore);
  useEffect(() => {
    let active = true;
    listInvitations(direction)
      .then((page) => {
        if (active) setState({ status: 'ready', error: '', ...page });
      })
      .catch((failure) => {
        if (!active) return;
        if (sessionExpired(failure)) onSessionExpired();
        else
          setState({
            ...initialState,
            status: 'error',
            error: errorMessage(failure),
          });
      });
    return () => {
      active = false;
    };
  }, [direction, attempt, onSessionExpired, reloadKey]);

  function retry() {
    setState(initialState);
    setMore(initialMore);
    setAttempt((value) => value + 1);
  }

  async function loadMore() {
    const cursor = state.nextCursor;
    if (!cursor || more.status === 'loading') return;
    setMore({ ...initialMore, status: 'loading' });
    try {
      const page = await listInvitations(direction, cursor);
      setState((current) => appendPage(current, page));
      setMore({
        ...initialMore,
        focusId: page.invitations[0]?.id ?? null,
        announcement: loadedMessage(page.invitations.length),
      });
    } catch (failure) {
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
