import { useAccount } from './useAccount.js';
import { SignIn } from './SignIn.jsx';
import { Profile } from './Profile.jsx';

export function Account() {
  const account = useAccount();
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
    <Profile user={account.user} submit={account.submit} />
  ) : (
    <SignIn submit={account.submit} />
  );
}
