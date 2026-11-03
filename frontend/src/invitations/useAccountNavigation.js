import { useEffect, useRef } from 'react';

/** @typedef {import('react').RefObject<(() => void) | null>} NavigationRef */
/** @param {{navigationRef: NavigationRef, selected: import('./api.js').Invitation | null, setSelected: (value: import('./api.js').Invitation | null) => void, onGoToAccount: () => void}} options */
export function useAccountNavigation({
  navigationRef,
  selected,
  setSelected,
  onGoToAccount,
}) {
  const conversationNavigation = useRef(
    /** @type {(() => void) | null} */ (null),
  );
  const opener = useRef(/** @type {HTMLElement | null} */ (null));
  const destination = useRef('invitations');
  useEffect(() => {
    navigationRef.current = () => {
      if (selected) conversationNavigation.current?.();
      else onGoToAccount();
    };
    return () => {
      navigationRef.current = null;
    };
  }, [navigationRef, selected, onGoToAccount]);
  useEffect(() => {
    if (selected) return;
    if (destination.current === 'account') {
      destination.current = 'invitations';
      onGoToAccount();
    } else opener.current?.focus();
  }, [selected, onGoToAccount]);
  function goToAccount() {
    destination.current = 'account';
    setSelected(null);
  }
  /** @param {import('./api.js').Invitation} invitation */
  function open(invitation) {
    opener.current = /** @type {HTMLElement | null} */ (document.activeElement);
    setSelected(invitation);
  }
  return { conversationNavigation, open, goToAccount };
}
