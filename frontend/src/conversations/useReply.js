import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../account/api.js';
import { MESSAGE_MAX, sendMessage } from './api.js';
import { sessionExpired } from './useConversation.js';

/** @param {{roomId?: string, userId: string, expired: boolean, onExpired: () => void, onSent: (message: import('./api.js').Message) => void}} options */
export function useReply(options) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const pending = useRef(false);
  useEffect(() => {
    generation.current += 1;
    return () => {
      generation.current += 1;
    };
  }, []);
  async function send() {
    if (
      !options.roomId ||
      options.expired ||
      pending.current ||
      !validReply(text)
    )
      return;
    const version = generation.current;
    pending.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const message = await sendMessage(options.roomId, text, options.userId);
      if (version !== generation.current) return;
      options.onSent(message);
      setText('');
      setNotice('Message sent.');
    } catch (failure) {
      if (version !== generation.current) return;
      if (sessionExpired(failure)) options.onExpired();
      else
        setError(
          `${errorMessage(failure)} Your text is kept here. Refresh messages to check whether it arrived before sending again.`,
        );
    } finally {
      if (version === generation.current) {
        pending.current = false;
        setBusy(false);
      }
    }
  }
  return { text, setText, busy, error, notice, send, valid: validReply(text) };
}

/** @param {string} text */
function validReply(text) {
  const length = text.trim().length;
  return length > 0 && length <= MESSAGE_MAX;
}
