import { Field, Feedback } from './Fields.jsx';
import { useSignIn } from './useSignIn.js';

/** @param {{submit: (path: string, body: unknown) => Promise<void>}} props */
export function SignIn({ submit }) {
  const { register, busy, error, notice, handleSubmit, switchMode } =
    useSignIn(submit);
  return (
    <section className="account-card" aria-labelledby="account-title">
      <p className="eyebrow">Your CallingIn account</p>
      <h2 id="account-title">
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
      <Field
        name="password"
        label="Password"
        type="password"
        autoComplete={register ? 'new-password' : 'current-password'}
        minLength={8}
        aria-describedby="password-guidance"
        onInvalid={(event) => {
          if (event.currentTarget.validity.tooShort)
            event.currentTarget.setCustomValidity(
              'This field must have at least 8 characters.',
            );
        }}
        onInput={(event) => event.currentTarget.setCustomValidity('')}
        maxLength={128}
      />
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
            <li>Not contain your email address.</li>
          </ul>
          <p>Maximum 128 characters. Spaces are allowed.</p>
        </>
      ) : (
        <p>Use 8–128 characters. Spaces are allowed.</p>
      )}
    </div>
  );
}
