import { useState } from 'react';
import { ApiError, errorMessage } from '../account/api.js';
import { createInvitation, lookupRecipient, MESSAGE_MAX } from './api.js';

/** @typedef {{message: string, expired?: boolean}} SendProblem */

/** @param {unknown} failure @param {number} status */
function hasStatus(failure, status) {
  return failure instanceof ApiError && failure.status === status;
}

/**
 * Lookup, compose, and send. The draft lives only in memory: never browser
 * storage, so the next person on a shared device cannot see it.
 * @param {() => void} onSent
 * @param {() => void} onSessionExpired
 */
export function useSendInvitation(onSent, onSessionExpired) {
  const [email, setEmail] = useState('');
  const [recipient, setRecipient] = useState(
    /** @type {import('./api.js').Recipient | null} */ (null),
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(
    /** @type {SendProblem | null} */ (null),
  );
  const [sentTo, setSentTo] = useState('');
  const [returning, setReturning] = useState(false);

  async function find() {
    setBusy(true);
    setProblem(null);
    setSentTo('');
    try {
      setRecipient(await lookupRecipient(email.trim()));
    } catch (failure) {
      if (hasStatus(failure, 401)) onSessionExpired();
      else setProblem({ message: lookupProblem(failure) });
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!recipient) return;
    const invalid = draftProblem(message);
    if (invalid) return setProblem({ message: invalid });
    setBusy(true);
    setProblem(null);
    try {
      await createInvitation(recipient.id, message);
      setSentTo(recipient.displayName);
      setRecipient(null);
      setMessage('');
      setEmail('');
      setReturning(false);
      onSent();
    } catch (failure) {
      setProblem(sendProblem(failure, recipient.displayName));
    } finally {
      setBusy(false);
    }
  }

  function changePerson() {
    setRecipient(null);
    setProblem(null);
    setReturning(true);
  }
  return {
    ...{ email, setEmail, recipient, message, setMessage },
    ...{ busy, problem, sentTo, returning, find, send, changePerson },
  };
}

/** @param {unknown} failure */
function lookupProblem(failure) {
  if (hasStatus(failure, 404))
    return 'No account matches that email. Check the spelling — they may not have joined CallingIn yet.';
  return errorMessage(failure);
}

/** @param {string} message */
function draftProblem(message) {
  const length = message.trim().length;
  if (length === 0) return 'Write a message before sending.';
  if (length > MESSAGE_MAX)
    return `Shorten your message to ${MESSAGE_MAX.toLocaleString()} characters or fewer.`;
  return '';
}

/**
 * An expired session keeps the draft on screen so it can be copied first.
 * @param {unknown} failure @param {string} name
 * @returns {SendProblem}
 */
function sendProblem(failure, name) {
  if (hasStatus(failure, 401))
    return {
      message:
        'Your session has ended. Copy your message if you’d like to keep it, then sign in again.',
      expired: true,
    };
  if (hasStatus(failure, 409))
    return {
      message: `You and ${name} already have an invitation. Only one is allowed between two accounts.`,
    };
  if (hasStatus(failure, 404))
    return { message: 'That account is no longer available.' };
  return { message: errorMessage(failure) };
}
