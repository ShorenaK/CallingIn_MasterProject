import { useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage } from '../account/api.js';
import { batteryRequest } from './api.js';

/** @typedef {{status: import('./api.js').BatteryStatus | null, loading: boolean, loaded: boolean, busy: boolean, expired: boolean, error: string, notice: string}} BatteryState */
/** @type {BatteryState} */
const initial = {
  status: null,
  loading: true,
  loaded: false,
  busy: false,
  expired: false,
  error: '',
  notice: '',
};

/** @param {string} path */
export function useBattery(path) {
  const [state, setState] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const pending = useRef(false);
  useEffect(() => {
    const version = ++generation.current;
    setState(initial);
    batteryRequest(path)
      .then((status) => {
        if (version === generation.current)
          setState({ ...initial, loading: false, loaded: true, status });
      })
      .catch((failure) => {
        if (version === generation.current)
          setState({ ...initial, loading: false, ...failureState(failure) });
      });
    return () => {
      generation.current += 1;
    };
  }, [path, attempt]);
  /** @param {import('./api.js').BatteryStatus} status */
  async function save(status) {
    if (pending.current || state.loading || state.expired) return;
    const version = generation.current;
    pending.current = true;
    setState((current) => ({ ...current, busy: true, error: '', notice: '' }));
    try {
      const saved = await batteryRequest(path, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (saved !== status)
        throw new Error(
          'The saved status could not be confirmed. Reload saved status before trying again.',
        );
      if (version === generation.current)
        setState((current) => ({
          ...current,
          status: saved,
          notice: 'Your Social Battery status has been saved.',
        }));
    } catch (failure) {
      if (version === generation.current)
        setState((current) => ({ ...current, ...failureState(failure) }));
    } finally {
      pending.current = false;
      if (version === generation.current)
        setState((current) => ({ ...current, busy: false }));
    }
  }
  return { ...state, save, refresh: () => setAttempt((value) => value + 1) };
}

/** @param {unknown} failure */
function failureState(failure) {
  const expired = failure instanceof ApiError && failure.status === 401;
  return {
    expired,
    error: expired
      ? 'Your session has ended. Sign in again when you’re ready.'
      : errorMessage(failure),
  };
}
