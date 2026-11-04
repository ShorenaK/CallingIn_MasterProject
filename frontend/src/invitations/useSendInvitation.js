import { hasMessageContent } from '../message-content.js';
import { useState } from 'react';
import { ApiError, errorMessage } from '../account/api.js';
import { createInvitation, lookupRecipient, MESSAGE_MAX } from './api.js';
import { useCoach } from '../coach/useCoach.js';

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
  const coach = useCoach(message, setMessage);
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
      if (hasStatus(failure, 401) && !message && !coach.hasText)
        onSessionExpired();
      else setProblem(lookupProblem(failure));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!recipient || busy || coach.busy || coach.expired) return;
    await submitInvitation({
      recipient,
      message,
      setBusy,
      setProblem,
      onSuccess: () => {
        setSentTo(recipient.displayName);
        resetDraft(true);
        setReturning(false);
        onSent();
      },
    });
  }

  function resetDraft(clear = false) {
    coach.reset();
    setRecipient(null);
    setProblem(null);
    setReturning(true);
    if (clear) {
      setMessage('');
      setEmail('');
    }
  }
  return {
    ...{ coach, email, setEmail, recipient, message, setMessage },
    ...{ busy, problem, sentTo, returning, find, send },
    changePerson: () => resetDraft(),
    cancel: () => resetDraft(true),
  };
}

/** @param {{recipient: import('./api.js').Recipient, message: string,
 * setBusy: (value: boolean) => void, setProblem: (value: SendProblem | null) => void,
 * onSuccess: () => void}} options
 */
async function submitInvitation({
  recipient,
  message,
  setBusy,
  setProblem,
  onSuccess,
}) {
  const invalid = draftProblem(message);
  if (invalid) return setProblem({ message: invalid });
  setBusy(true);
  setProblem(null);
  try {
    await createInvitation(recipient.id, message);
    onSuccess();
  } catch (failure) {
    setProblem(sendProblem(failure, recipient.displayName));
  } finally {
    setBusy(false);
  }
}

/** @param {unknown} failure */
function lookupProblem(failure) {
  if (hasStatus(failure, 401)) return sendProblem(failure, '');
  if (hasStatus(failure, 404))
    return {
      message:
        'No account matches that email. Check the spelling — they may not have joined CallingIn yet.',
    };
  return { message: errorMessage(failure) };
}

/** @param {string} message */
function draftProblem(message) {
  const length = message.trim().length;
  if (!hasMessageContent(message))
    return 'Write a message with visible content before sending.';
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
