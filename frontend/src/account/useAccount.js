import { useCallback, useEffect, useState } from 'react';
import { accountRequest, ApiError, errorMessage } from './api.js';

export function useAccount() {
  const [user, setUser] = useState(
    /** @type {import('./api.js').User | null} */ (null),
  );
  const [status, setStatus] = useState(
    /** @type {'loading' | 'ready' | 'error'} */ ('loading'),
  );
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      setError('Checking your session took too long. Please try again.');
      setStatus('error');
    }, 10000);
    accountRequest('me', { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setUser(data?.user ?? null);
        setStatus('ready');
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        if (failure instanceof ApiError && failure.status === 401) {
          setUser(null);
          setStatus('ready');
        } else {
          setError(errorMessage(failure));
          setStatus('error');
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  const [sessionNotice, setSessionNotice] = useState('');
  const submit = createAccountSubmit(setUser, setSessionNotice);
  // Stable so signed-in features can depend on it without refetch loops.
  const expire = useCallback(() => {
    setUser(null);
    setSessionNotice('Your session has ended. Please sign in again.');
  }, []);
  function retry() {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }
  return { user, status, error, retry, submit, expire, sessionNotice };
}

/**
 * @param {(user: import('./api.js').User | null) => void} setUser
 * @param {(notice: string) => void} setSessionNotice
 */
function createAccountSubmit(setUser, setSessionNotice) {
  /** @param {string} path @param {unknown} body @param {string} [method] */
  return async function submit(path, body, method = 'POST') {
    setSessionNotice('');
    try {
      const data = await accountRequest(path, {
        method,
        body: JSON.stringify(body),
      });
      if (path !== 'register') setUser(data?.user ?? null);
    } catch (failure) {
      if (
        failure instanceof ApiError &&
        failure.status === 401 &&
        path === 'me'
      )
        setUser(null);
      throw failure;
    }
  };
}
