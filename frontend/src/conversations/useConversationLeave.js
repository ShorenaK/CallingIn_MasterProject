import { useCallback, useEffect, useState } from 'react';

/** @typedef {'invitations' | 'account'} LeaveDestination */
/** @param {{navigationRef: import('../invitations/useAccountNavigation.js').NavigationRef, text: string, busy: boolean, onBack: () => void, onGoToAccount: () => void}} options */
export function useConversationLeave({
  navigationRef,
  text,
  busy,
  onBack,
  onGoToAccount,
}) {
  const [destination, setDestination] = useState(
    /** @type {LeaveDestination | null} */ (null),
  );
  const finish = useCallback(
    /** @param {LeaveDestination} target */ (target) => {
      if (target === 'account') onGoToAccount();
      else onBack();
    },
    [onBack, onGoToAccount],
  );
  const request = useCallback(
    /** @param {LeaveDestination} target */ (target) => {
      if (busy) return;
      if (text.length) setDestination(target);
      else finish(target);
    },
    [busy, text, finish],
  );
  useEffect(() => {
    navigationRef.current = () => request('account');
    return () => {
      navigationRef.current = null;
    };
  }, [navigationRef, request]);
  function discard() {
    if (!busy && destination) finish(destination);
  }
  return {
    destination,
    requestBack: () => request('invitations'),
    keep: () => setDestination(null),
    discard,
  };
}
