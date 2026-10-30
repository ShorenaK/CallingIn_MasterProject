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

/** @type {ListState} */
const initialState = {
  status: 'loading',
  invitations: [],
  nextCursor: null,
  error: '',
};

/**
 * @param {import('./api.js').Direction} direction
 * @param {() => void} onSessionExpired Must be stable between renders.
 */
export function useInvitationList(direction, onSessionExpired) {
  const [state, setState] = useState(initialState);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    listInvitations(direction)
      .then((page) => {
        if (active) setState({ status: 'ready', error: '', ...page });
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 401)
          onSessionExpired();
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
  }, [direction, attempt, onSessionExpired]);

  function retry() {
    setState(initialState);
    setAttempt((value) => value + 1);
  }
  return { ...state, retry };
}
