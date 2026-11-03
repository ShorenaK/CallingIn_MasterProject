import { useCallback, useRef } from 'react';
import { SocialBattery } from '../social-battery/SocialBattery.jsx';
import { useAccount } from './useAccount.js';
import { SignIn } from './SignIn.jsx';
import { Profile } from './Profile.jsx';
import { Invitations } from '../invitations/Invitations.jsx';

/** @param {{navigationRef: import('../invitations/useAccountNavigation.js').NavigationRef}} props */
export function Account({ navigationRef }) {
  const account = useAccount();
  const headingRef = useRef(/** @type {HTMLHeadingElement | null} */ (null));
  const focusProfile = useCallback(() => {
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: 'start' });
  }, []);
  if (account.status === 'loading')
    return (
      <section className="account-card" role="status">
        Checking your session…
      </section>
    );
  if (account.status === 'error')
    return (
      <section className="account-card">
        <h2>Unable to check your session</h2>
        <p role="alert">{account.error}</p>
        <button type="button" onClick={account.retry}>
          Try again
        </button>
      </section>
    );
  return account.user ? (
    <>
      <Profile
        user={account.user}
        submit={account.submit}
        headingRef={headingRef}
      />
      <SocialBattery key={account.user.id} onSignIn={account.expire} />
      <Invitations
        userId={account.user.id}
        onSessionExpired={account.expire}
        navigationRef={navigationRef}
        onGoToAccount={focusProfile}
      />
    </>
  ) : (
    <SignIn submit={account.submit} sessionNotice={account.sessionNotice} />
  );
}
