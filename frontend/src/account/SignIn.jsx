import { useEffect, useRef } from 'react';
import { Field, Feedback } from './Fields.jsx';
import { PasswordField } from './PasswordField.jsx';
import { useSignIn } from './useSignIn.js';

/** @param {{submit: (path: string, body: unknown) => Promise<void>, sessionNotice?: string}} props */
export function SignIn({ submit, sessionNotice = '' }) {
  const { register, busy, error, notice, handleSubmit, switchMode } = useSignIn(
    submit,
    sessionNotice,
  );
  const title = useRef(/** @type {HTMLHeadingElement | null} */ (null));
  // After an expired session the previous view disappears; give focus a home.
  useEffect(() => {
    if (sessionNotice) title.current?.focus();
  }, [sessionNotice]);
  return (
    <section className="account-card" aria-labelledby="account-title">
      <p className="eyebrow">Your CallingIn account</p>
      <h2 id="account-title" ref={title} tabIndex={-1}>
        {register ? 'Create your account' : 'Welcome back'}
      </h2>
      <Feedback error={error} notice={notice} />
      <form key={String(register)} onSubmit={handleSubmit} aria-busy={busy}>
        <fieldset disabled={busy}>
          <SignInFields register={register} />
          <button type="submit">
            {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
          </button>
        </fieldset>
      </form>
      <button
        className="text-button"
        type="button"
        disabled={busy}
        onClick={switchMode}
      >
        {register
          ? 'Already have an account? Sign in'
          : 'New here? Create an account'}
      </button>
    </section>
  );
}

/** @param {{register: boolean}} props */
function SignInFields({ register }) {
  return (
    <>
      {register && (
        <Field
          name="displayName"
          label="Display name"
          autoComplete="nickname"
          maxLength={80}
        />
      )}
      <Field
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        maxLength={254}
      />
      <PasswordField register={register} />
      <PasswordGuidance register={register} />
      {!register && (
        <label className="checkbox-field">
          <input type="checkbox" name="keepSignedIn" /> Keep me signed in
        </label>
      )}
      {!register && (
        <p className="field-hint">
          Stay signed in for up to 90 days of inactivity. Leave unchecked on a
          shared device.
        </p>
      )}
    </>
  );
}

/** @param {{register: boolean}} props */
function PasswordGuidance({ register }) {
  return (
    <div id="password-guidance" className="field-hint">
      {register ? (
        <>
          <p>Your password must:</p>
          <ul>
            <li>Contain at least 8 characters.</li>
            <li>Contain no more than 18 characters.</li>
            <li>Don’t use your email address.</li>
            <li>Contain no spaces.</li>
          </ul>
        </>
      ) : (
        <p>Enter the password you used to create your account.</p>
      )}
    </div>
  );
}
