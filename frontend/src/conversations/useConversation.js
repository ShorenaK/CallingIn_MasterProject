import { useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage } from '../account/api.js';
import { openConversation, listMessages } from './api.js';

/** @param {unknown} failure */
export function sessionExpired(failure) {
  return failure instanceof ApiError && failure.status === 401;
}

/** @param {string} invitationId @param {string} userId @param {() => void} onExpired */
export function useConversation(invitationId, userId, onExpired) {
  const [room, setRoom] = useState(
    /** @type {import('./api.js').Conversation | null} */ (null),
  );
  const [error, setError] = useState('');
  const [canRetry, setCanRetry] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    setCanRetry(true);
    openConversation(invitationId, userId)
      .then((value) => {
        if (active) setRoom(value);
      })
      .catch((failure) => {
        if (!active) return;
        if (sessionExpired(failure)) onExpired();
        else {
          setCanRetry(
            !(
              failure instanceof ApiError && [404, 409].includes(failure.status)
            ),
          );
          setError(errorMessage(failure));
        }
      });
    return () => {
      active = false;
    };
  }, [invitationId, userId, onExpired, attempt]);
  return {
    room,
    error,
    canRetry,
    retry: () => setAttempt((value) => value + 1),
  };
}

/** @typedef {{status: 'loading' | 'ready' | 'error' | 'expired', messages: import('./api.js').Message[], nextCursor: string | null, error: string, moreError: string, busy: boolean, notice: string, focusId: string | null}} HistoryState */
/** @type {HistoryState} */
const initial = {
  status: 'loading',
  messages: [],
  nextCursor: null,
  error: '',
  moreError: '',
  busy: false,
  notice: '',
  focusId: null,
};

/** @param {string | undefined} roomId @param {() => void} onExpired */
export function useMessageHistory(roomId, onExpired) {
  const [state, setState] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const morePending = useRef(false);
  const loading = useRef(true);
  useEffect(
    () =>
      startHistory(
        { roomId, onExpired, setState, generation, loading },
        attempt > 0,
      ),
    [roomId, onExpired, attempt],
  );
  async function loadOlder() {
    if (!roomId || !state.nextCursor || morePending.current) return;
    const version = generation.current;
    morePending.current = true;
    setState((current) => ({
      ...current,
      busy: true,
      moreError: '',
      notice: '',
      focusId: null,
    }));
    try {
      const page = await listMessages(roomId, state.nextCursor);
      if (version !== generation.current) return;
      setState((current) => appendOlderPage(current, page));
    } catch (failure) {
      if (version !== generation.current) return;
      if (sessionExpired(failure)) onExpired();
      else
        setState((current) => ({
          ...current,
          busy: false,
          moreError: errorMessage(failure),
        }));
    } finally {
      if (version === generation.current) morePending.current = false;
    }
  }
  /** @param {import('./api.js').Message} message */
  function add(message) {
    setState((current) => ({
      ...current,
      messages: mergeMessages(current.messages, [message]),
    }));
  }
  function refresh() {
    if (loading.current) return;
    loading.current = true;
    morePending.current = false;
    generation.current += 1;
    setAttempt((value) => value + 1);
  }
  return { ...state, loadOlder, refresh, add };
}

/** @param {import('./api.js').Message[]} current @param {import('./api.js').Message[]} incoming */
function mergeMessages(current, incoming) {
  return [
    ...new Map(
      [...current, ...incoming].map((message) => [message.id, message]),
    ).values(),
  ].sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
}

/** @param {{roomId?: string, onExpired: () => void, setState: import('react').Dispatch<import('react').SetStateAction<HistoryState>>, generation: import('react').RefObject<number>, loading: import('react').RefObject<boolean>}} options
 * @param {boolean} refreshed
 */
function startHistory(
  { roomId, onExpired, setState, generation, loading },
  refreshed,
) {
  const version = ++generation.current;
  loading.current = true;
  setState(initial);
  if (roomId)
    listMessages(roomId)
      .then((page) => {
        if (version === generation.current)
          setState({
            ...initial,
            ...page,
            status: 'ready',
            notice: refreshed ? 'Messages updated.' : 'Messages loaded.',
          });
      })
      .catch((failure) => {
        if (version !== generation.current) return;
        if (sessionExpired(failure)) {
          setState((current) => ({
            ...current,
            status: 'expired',
            busy: false,
          }));
          onExpired();
        } else
          setState({
            ...initial,
            status: 'error',
            error: errorMessage(failure),
          });
      })
      .finally(() => {
        if (version === generation.current) loading.current = false;
      });
  return () => {
    generation.current += 1;
  };
}

/** @param {HistoryState} current @param {import('./api.js').MessagePage} page @returns {HistoryState} */
function appendOlderPage(current, page) {
  return {
    ...current,
    messages: mergeMessages(current.messages, page.messages),
    nextCursor: page.nextCursor,
    busy: false,
    notice: `Loaded ${page.messages.length} older messages.`,
    focusId: page.messages.at(-1)?.id ?? null,
  };
}
