import { useEffect, useRef } from 'react';
import { MESSAGE_MAX } from './api.js';
import { Problem } from './Problem.jsx';
import { useSendInvitation } from './useSendInvitation.js';

const numbers = new Intl.NumberFormat();

/** @typedef {ReturnType<typeof useSendInvitation>} SendState */

/** @param {{onSent: () => void, onSessionExpired: () => void}} props */
export function SendInvitation({ onSent, onSessionExpired }) {
  const send = useSendInvitation(onSent, onSessionExpired);
  return (
    <section
      className="invitation-panel send-panel"
      aria-labelledby="send-title"
    >
      <h3 id="send-title">Send an invitation</h3>
      {send.sentTo && <SentNotice name={send.sentTo} />}
      {send.problem && (
        <Problem
          message={send.problem.message}
          onRetry={send.problem.expired ? onSessionExpired : undefined}
          actionLabel="Sign in again"
        />
      )}
      {send.recipient ? (
        <ComposeMessage send={send} />
      ) : (
        <FindPerson send={send} />
      )}
    </section>
  );
}

/** @param {{name: string}} props */
function SentNotice({ name }) {
  const notice = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  useEffect(() => {
    notice.current?.focus();
  }, [name]);
  return (
    <p className="form-notice" role="status" ref={notice} tabIndex={-1}>
      <span aria-hidden="true">✓</span> Invitation sent to {name}.
    </p>
  );
}

/** @param {{send: SendState}} props */
function FindPerson({ send }) {
  const input = useRef(/** @type {HTMLInputElement | null} */ (null));
  // Returning from "Change person" puts the cursor back in the email field.
  useEffect(() => {
    if (send.returning) input.current?.focus();
  }, [send.returning]);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void send.find();
      }}
      aria-busy={send.busy}
    >
      <fieldset disabled={send.busy}>
        <label className="form-field" htmlFor="recipient-email">
          <span>Their email address</span>
          <input
            id="recipient-email"
            ref={input}
            type="email"
            required
            maxLength={254}
            autoComplete="off"
            aria-describedby="recipient-email-hint"
            value={send.email}
            onChange={(event) => send.setEmail(event.target.value)}
          />
        </label>
        <p id="recipient-email-hint" className="field-hint">
          Enter the exact email they use for CallingIn. To protect privacy,
          lookups are limited to 10 every 15 minutes.
        </p>
        <button type="submit">{send.busy ? 'Finding…' : 'Find person'}</button>
      </fieldset>
    </form>
  );
}

/** @param {{send: SendState}} props */
function ComposeMessage({ send }) {
  const found = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  useEffect(() => {
    found.current?.focus();
  }, []);
  const length = send.message.trim().length;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void send.send();
      }}
      aria-busy={send.busy}
    >
      <p className="recipient-found" ref={found} tabIndex={-1}>
        <span aria-hidden="true">✓</span> Sending to{' '}
        <strong>{send.recipient?.displayName}</strong>
      </p>
      <button
        type="button"
        className="text-button"
        disabled={send.busy}
        onClick={send.changePerson}
      >
        Change person
      </button>
      <fieldset disabled={send.busy}>
        <label className="form-field" htmlFor="invitation-message">
          <span>Your message</span>
          <textarea
            id="invitation-message"
            rows={6}
            aria-describedby="message-hint message-count"
            aria-invalid={length > MESSAGE_MAX || undefined}
            value={send.message}
            onChange={(event) => send.setMessage(event.target.value)}
          />
        </label>
        <p id="message-hint" className="field-hint">
          Write in your own words. Up to {numbers.format(MESSAGE_MAX)}{' '}
          characters; some emoji count as two.
        </p>
        <MessageCounter length={length} />
        <button type="submit">
          {send.busy ? 'Sending…' : 'Send invitation'}
        </button>
        <p className="field-hint">
          You choose when to connect. They can accept, choose Maybe Later, or
          say they need some space.
        </p>
      </fieldset>
    </form>
  );
}

/** Announced only when crossing a zone, not on every keystroke. */
const ANNOUNCEMENTS = {
  ok: '',
  near: '100 or fewer characters left.',
  over: `Your message is over the ${numbers.format(MESSAGE_MAX)}-character limit.`,
};

/** @param {{length: number}} props */
function MessageCounter({ length }) {
  const over = length - MESSAGE_MAX;
  const zone = over > 0 ? 'over' : MESSAGE_MAX - length <= 100 ? 'near' : 'ok';
  const text =
    over > 0
      ? `${numbers.format(over)} ${over === 1 ? 'character' : 'characters'} over the limit`
      : `${numbers.format(length)} of ${numbers.format(MESSAGE_MAX)} characters`;
  return (
    <>
      <p id="message-count" className={`message-count count-${zone}`}>
        {over > 0 && <span aria-hidden="true">ⓘ </span>}
        {text}
      </p>
      <p className="visually-hidden" role="status">
        {ANNOUNCEMENTS[zone]}
      </p>
    </>
  );
}
