import { useState } from 'react';
import { Field, Feedback } from './Fields.jsx';
import { errorMessage } from './api.js';

/** @param {{user: import('./api.js').User, submit: (path: string, body: unknown, method?: string) => Promise<void>}} props */
export function Profile({ user, submit }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function save(event) {
    event.preventDefault();
    const displayName = String(
      new FormData(event.currentTarget).get('displayName'),
    ).trim();
    await perform('me', { displayName }, 'PATCH');
  }
  /** @param {string} path @param {unknown} body @param {string} [method] */
  async function perform(path, body, method) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await submit(path, body, method);
      if (path === 'me') setNotice('Your profile has been saved.');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-card" aria-labelledby="profile-title">
      <p className="eyebrow">Your space</p>
      <h2 id="profile-title">Hello, {user.displayName}</h2>
      <Feedback error={error} notice={notice} />
      <form onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy}>
          <Field
            key={user.displayName}
            name="displayName"
            label="Display name"
            autoComplete="nickname"
            maxLength={80}
            defaultValue={user.displayName}
          />
          <p className="field-hint">1–80 characters.</p>
          <p className="profile-email">Email address: {user.email}</p>
          <button type="submit">
            {busy ? 'Please wait…' : 'Save profile'}
          </button>
        </fieldset>
      </form>
      <button
        className="text-button"
        type="button"
        disabled={busy}
        onClick={() => void perform('logout', {})}
      >
        Sign out
      </button>
    </section>
  );
}
