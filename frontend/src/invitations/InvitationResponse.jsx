import { useEffect, useRef, useState } from 'react';
import { ApiError, errorMessage } from '../account/api.js';
import { respondToInvitation } from './api.js';
import { Problem } from './Problem.jsx';

/** @typedef {'accepted' | 'declined'} FinalChoice */
/** @typedef {Exclude<import('./api.js').InvitationStatus, 'pending'>} Choice */

/** Final choices cannot be changed, so each asks once before saving. */
const CONFIRM = {
  accepted: {
    question:
      'Accept this invitation? This is final — you can’t change it later.',
    yes: 'Yes, accept',
  },
  declined: {
    question:
      'Choose I need some space? This closes the invitation and is final.',
    yes: 'Yes, I need some space',
  },
};

/**
 * @typedef {object} ResponseProps
 * @property {import('./api.js').Invitation} invitation
 * @property {string} personLabel Card title, used to name the button group.
 * @property {(updated: import('./api.js').Invitation) => void} onResponded
 * @property {() => void} onRefresh
 * @property {() => void} onSessionExpired
 */

/** @param {ResponseProps} props */
export function InvitationResponse(props) {
  const [confirming, setConfirming] = useState(
    /** @type {FinalChoice | null} */ (null),
  );
  const { busy, problem, send } = useResponse(props, setConfirming);
  const question = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  const buttons = useRef(
    /** @type {Partial<Record<FinalChoice, HTMLButtonElement | null>>} */ ({}),
  );
  const previous = useRef(confirming);
  // Focus follows the conversation: to the question, then back to its button.
  useEffect(() => {
    if (confirming) question.current?.focus();
    else if (previous.current) buttons.current[previous.current]?.focus();
    previous.current = confirming;
  }, [confirming]);

  return (
    <div className="invitation-response">
      {problem && (
        <Problem
          message={problem.message}
          onRetry={problem.refresh ? props.onRefresh : undefined}
          actionLabel="Refresh list"
        />
      )}
      {confirming ? (
        <ConfirmPanel
          choice={confirming}
          busy={busy}
          questionRef={question}
          onConfirm={() => void send(confirming)}
          onCancel={() => setConfirming(null)}
        />
      ) : (
        <ChoiceButtons
          {...props}
          busy={busy}
          buttons={buttons}
          onChoose={(choice) =>
            choice === 'deferred' ? void send(choice) : setConfirming(choice)
          }
        />
      )}
    </div>
  );
}

/**
 * @param {{choice: FinalChoice, busy: boolean, questionRef: import('react').RefObject<HTMLParagraphElement | null>, onConfirm: () => void, onCancel: () => void}} props
 */
function ConfirmPanel({ choice, busy, questionRef, onConfirm, onCancel }) {
  return (
    <div className="invitation-confirm">
      <p ref={questionRef} tabIndex={-1}>
        {CONFIRM[choice].question}
      </p>
      <div className="invitation-actions">
        <button
          type="button"
          className={`response-${choice}`}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? 'Saving…' : CONFIRM[choice].yes}
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={busy}
          onClick={onCancel}
        >
          Go back
        </button>
      </div>
    </div>
  );
}

/**
 * @param {ResponseProps & {busy: boolean, buttons: import('react').RefObject<Partial<Record<FinalChoice, HTMLButtonElement | null>>>, onChoose: (choice: Choice) => void}} props
 */
function ChoiceButtons({ invitation, personLabel, busy, buttons, onChoose }) {
  return (
    <div
      className="invitation-actions"
      role="group"
      aria-label={`Respond: ${personLabel}`}
    >
      <button
        type="button"
        className="response-accepted"
        ref={(element) => {
          buttons.current.accepted = element;
        }}
        disabled={busy}
        onClick={() => onChoose('accepted')}
      >
        Accept
      </button>
      {invitation.status === 'pending' && (
        <button
          type="button"
          className="response-deferred"
          disabled={busy}
          onClick={() => onChoose('deferred')}
        >
          {busy ? 'Saving…' : 'Maybe Later'}
        </button>
      )}
      <button
        type="button"
        className="response-declined"
        ref={(element) => {
          buttons.current.declined = element;
        }}
        disabled={busy}
        onClick={() => onChoose('declined')}
      >
        I need some space
      </button>
    </div>
  );
}

/**
 * @param {ResponseProps} props
 * @param {(choice: FinalChoice | null) => void} setConfirming
 */
function useResponse(props, setConfirming) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(
    /** @type {{message: string, refresh: boolean} | null} */ (null),
  );
  /** @param {Choice} status */
  async function send(status) {
    setBusy(true);
    setProblem(null);
    try {
      props.onResponded(await respondToInvitation(props.invitation.id, status));
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        props.onSessionExpired();
        return;
      }
      setConfirming(null);
      setProblem({
        message: errorMessage(failure),
        refresh: failure instanceof ApiError && failure.status === 409,
      });
    } finally {
      setBusy(false);
    }
  }
  return { busy, problem, send };
}
