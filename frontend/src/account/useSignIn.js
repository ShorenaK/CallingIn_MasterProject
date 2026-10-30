import { useState } from 'react';
import { errorMessage } from './api.js';

/** @param {(path: string, body: unknown) => Promise<void>} submit */
export function useSignIn(submit) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError('');
    setNotice('');
    const body = {
      email: String(fields.get('email')).trim(),
      password: String(fields.get('password')),
    };
    try {
      if (
        register &&
        body.password.toLowerCase().includes(body.email.toLowerCase())
      )
        throw new Error('Password must not contain your email address.');
      await submit(
        register ? 'register' : 'login',
        register
          ? { ...body, displayName: String(fields.get('displayName')).trim() }
          : { ...body, keepSignedIn: fields.get('keepSignedIn') === 'on' },
      );
      form.reset();
      if (register) {
        setRegister(false);
        setNotice('Account created. Sign in to continue.');
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  function switchMode() {
    setRegister(!register);
    setError('');
    setNotice('');
  }
  return { register, busy, error, notice, handleSubmit, switchMode };
}
