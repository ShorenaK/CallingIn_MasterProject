import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../account/api.js';
import { generateSuggestion, validCoachText } from './api.js';

/** Page-memory only. Abort and identity checks protect against late requests.
 * @param {string} message
 * @param {(text: string) => void} setMessage
 */
export function useCoach(message, setMessage) {
  const [intent, setIntent] = useState('');
  const [tone, setTone] = useState(
    /** @type {import('./api.js').CoachInput['tone']} */ ('natural'),
  );
  const [action, setAction] = useState(
    /** @type {import('./api.js').CoachInput['action']} */ ('draft'),
  );
  const [suggestion, setSuggestion] = useState(
    /** @type {string | null} */ (null),
  );
  const [previous, setPrevious] = useState(
    /** @type {{text: string, applied: string} | null} */ (null),
  );
  const snapshot = useRef('');
  const request = useCoachRequest(setSuggestion);
  function reset() {
    request.cancel();
    request.resetFeedback();
    setIntent('');
    setSuggestion(null);
    setPrevious(null);
  }
  function generate() {
    if (request.busy || request.expired || suggestion !== null) return;
    const text = action === 'draft' ? intent : message;
    snapshot.current = message;
    void request.run({ action, text: text.trim(), tone });
  }
  function apply() {
    if (suggestion === null || !validCoachText(suggestion)) return;
    request.cancel();
    setPrevious((current) => ({
      text: current?.text ?? message,
      applied: suggestion,
    }));
    setMessage(suggestion);
    setSuggestion(null);
  }
  function restore() {
    if (!previous) return;
    setMessage(previous.text);
    setPrevious(null);
  }
  return {
    ...{ intent, setIntent, tone, setTone, action, setAction },
    ...{ suggestion, setSuggestion, previous, generate, apply, restore, reset },
    ...request,
    hasText: Boolean(intent.length || suggestion !== null || previous),
    changed: message !== snapshot.current,
    restoreChanged: Boolean(previous && message !== previous.applied),
  };
}

/** @param {(text: string) => void} setSuggestion */
function useCoachRequest(setSuggestion) {
  const active = useRef(/** @type {AbortController | null} */ (null));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState('');
  const cancel = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setBusy(false);
    setNotice('');
  }, []);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  /** @param {import('./api.js').CoachInput} input */
  async function run(input) {
    if (active.current || expired) return;
    if (!validCoachText(input.text)) {
      setProblem(
        'Enter visible text of 5,000 characters or fewer for the Coach.',
      );
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setProblem('');
    setNotice('Generating suggestion…');
    try {
      const text = await generateSuggestion(
        input,
        AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]),
      );
      if (active.current !== controller) return;
      setSuggestion(text);
      setNotice('Suggestion ready. Review and edit it before using it.');
    } catch (failure) {
      if (active.current !== controller) return;
      const failureState = coachFailure(failure);
      setExpired(failureState.expired);
      setProblem(failureState.message);
      setNotice('');
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  return {
    ...{ busy, problem, expired, notice, cancel, run },
    resetFeedback: () => {
      if (!expired) setProblem('');
    },
  };
}

/** @param {unknown} failure */
function coachFailure(failure) {
  const expired = failure instanceof ApiError && failure.status === 401;
  return {
    expired,
    message: expired
      ? 'Your session has ended. Copy your message, intent, and suggestion before signing in again.'
      : coachErrorMessage(failure),
  };
}

/** @param {unknown} failure */
function coachErrorMessage(failure) {
  if (failure instanceof ApiError && failure.status === 503)
    return 'AI Coach is unavailable. Your writing is kept; you can write and send your own invitation.';
  if (failure instanceof ApiError && failure.status === 429) {
    const delay = failure.retryAfter;
    return delay === null
      ? 'Too many Coach requests. Your writing is kept; please try again later.'
      : `Too many Coach requests. Your writing is kept; try again in ${delay} ${delay === 1 ? 'second' : 'seconds'}.`;
  }
  return 'AI Coach could not generate a suggestion. Your writing is kept; try again or write your own message.';
}
