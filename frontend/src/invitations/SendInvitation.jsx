import { useEffect, useRef, useState } from 'react';
import { MESSAGE_MAX } from './api.js';
import { Problem } from './Problem.jsx';
import { useSendInvitation } from './useSendInvitation.js';
import { Coach } from '../coach/Coach.jsx';

const numbers = new Intl.NumberFormat();

/** @typedef {ReturnType<typeof useSendInvitation>} SendState */

/** @param {{onSent: () => void, onSessionExpired: () => void, active?: boolean}} props */
export function SendInvitation({ onSent, onSessionExpired, active = true }) {
  const send = useSendInvitation(onSent, onSessionExpired);
  const cancelGeneration = send.coach.cancel;
  useEffect(() => {
    if (!active) cancelGeneration();
  }, [active, cancelGeneration]);
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
        <ComposeMessage send={send} onSignIn={onSessionExpired} />
      ) : send.problem?.expired ? (
        <RetainedDraft message={send.message} />
      ) : (
        <FindPerson send={send} />
      )}
    </section>
  );
}

/** Keep the retained text visible so it can be copied before explicit sign-in.
 * @param {{message: string}} props
 */
function RetainedDraft({ message }) {
  const draft = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  useEffect(() => {
    draft.current?.focus();
  }, []);
  return (
    <label className="form-field" htmlFor="unsent-invitation-message">
      <span>Your unsent message</span>
      <textarea
        id="unsent-invitation-message"
        ref={draft}
        rows={6}
        value={message}
        readOnly
      />
    </label>
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
  // Returning from Change person or Cancel focuses the email field.
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

/** @param {{send: SendState, onSignIn: () => void}} props */
function ComposeMessage({ send, onSignIn }) {
  const [confirming, setConfirming] = useState('');
  const { cancelButton, personButton, found } = useComposeFocus(confirming);
  function changePerson() {
    if (send.coach.hasText) setConfirming('person');
    else send.changePerson();
  }
  if (confirming)
    return (
      <DiscardConfirmation
        coachText={send.coach.hasText}
        changing={confirming === 'person'}
        onDiscard={confirming === 'person' ? send.changePerson : send.cancel}
        onKeep={() => setConfirming('')}
      />
    );
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
        ref={personButton}
        type="button"
        className="text-button"
        disabled={send.busy}
        onClick={changePerson}
      >
        Change person
      </button>
      <fieldset disabled={send.busy}>
        <MessageFields send={send} />
        <Coach coach={send.coach} onSignIn={onSignIn} />
        <ComposeActions
          busy={send.busy}
          blocked={send.coach.busy || send.coach.expired}
          cancelRef={cancelButton}
          onCancel={() =>
            send.message.length || send.coach.hasText
              ? setConfirming('cancel')
              : send.cancel()
          }
        />
        <InvitationHint />
      </fieldset>
    </form>
  );
}

/** @param {string} confirming */
function useComposeFocus(confirming) {
  const cancelButton = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const personButton = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const previous = useRef('');
  const found = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  useEffect(() => {
    found.current?.focus();
  }, []);
  useEffect(() => {
    if (previous.current && !confirming) {
      const target =
        previous.current === 'person' ? personButton : cancelButton;
      target.current?.focus();
    }
    previous.current = confirming;
  }, [confirming]);
  return { cancelButton, personButton, found };
}

function InvitationHint() {
  return (
    <p className="field-hint">
      You choose when to connect. They can accept, choose Maybe Later, or say
      they need some space.
    </p>
  );
}

/** @param {{busy: boolean, blocked: boolean, cancelRef: import('react').RefObject<HTMLButtonElement | null>, onCancel: () => void}} props */
function ComposeActions({ busy, blocked, cancelRef, onCancel }) {
  return (
    <div className="invitation-actions compose-actions">
      <button type="submit" disabled={blocked}>
        {busy ? 'Sending…' : 'Send invitation'}
      </button>
      <button
        type="button"
        className="secondary-button"
        ref={cancelRef}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

/** @param {{send: SendState}} props */
function MessageFields({ send }) {
  const length = send.message.trim().length;
  return (
    <>
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
        Write in your own words and include visible content. Up to{' '}
        {numbers.format(MESSAGE_MAX)} characters; some emoji count as two.
      </p>
      <MessageCounter length={length} />
    </>
  );
}

/** @param {{onDiscard: () => void, onKeep: () => void, coachText: boolean, changing: boolean}} props */
function DiscardConfirmation({ onDiscard, onKeep, coachText, changing }) {
  const question = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  useEffect(() => {
    question.current?.focus();
  }, []);
  return (
    <div className="invitation-confirm">
      <p ref={question} tabIndex={-1}>
        {changing
          ? 'Change person? Your Coach writing will be cleared; your message will be kept.'
          : coachText
            ? 'Discard this invitation draft? Your message and Coach writing will be cleared.'
            : 'Discard this invitation draft? Your message will be cleared.'}
      </p>
      <div className="invitation-actions">
        <button type="button" className="secondary-button" onClick={onKeep}>
          Keep writing
        </button>
        <button type="button" onClick={onDiscard}>
          {changing
            ? 'Discard Coach writing and change person'
            : 'Discard draft'}
        </button>
      </div>
    </div>
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
