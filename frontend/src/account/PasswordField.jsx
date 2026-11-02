import { useState } from 'react';
import { Field } from './Fields.jsx';

/** @param {{register: boolean}} props */
export function PasswordField({ register }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Field
        name="password"
        label="Password"
        type={visible ? 'text' : 'password'}
        autoComplete={register ? 'new-password' : 'current-password'}
        minLength={8}
        maxLength={register ? undefined : 128}
        aria-describedby="password-guidance"
        onInvalid={(event) => {
          if (event.currentTarget.validity.tooShort)
            event.currentTarget.setCustomValidity(
              'This field must have at least 8 characters.',
            );
        }}
        onInput={(event) => event.currentTarget.setCustomValidity('')}
      />
      <button
        type="button"
        className="text-button"
        aria-controls="password"
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? 'Hide password' : 'Show password'}
      </button>
    </>
  );
}
