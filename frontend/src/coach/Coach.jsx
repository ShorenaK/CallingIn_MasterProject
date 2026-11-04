import { useEffect, useRef, useState } from 'react';
import { validCoachText } from './api.js';
import './coach.css';

/** @typedef {ReturnType<typeof import('./useCoach.js').useCoach>} CoachState */
/** @param {{coach: CoachState, onSignIn: () => void}} props */
export function Coach({ coach, onSignIn }) {
  return (
    <section className="coach" aria-labelledby="coach-title">
      <h4 id="coach-title">AI Coach (optional)</h4>
      <p className="field-hint" id="coach-privacy">
        OpenAI is the planned provider; live generation is not connected yet.
        Review suggestions before using them. Only Send invitation sends your
        message.
      </p>
      <CoachFields coach={coach} />
      <div className="coach-actions">
        <button
          id="coach-generate"
          type="button"
          className="secondary-button"
          aria-describedby="coach-privacy"
          aria-disabled={
            coach.busy || coach.expired || coach.suggestion !== null
          }
          onClick={coach.generate}
        >
          Generate suggestion
        </button>
        <button
          type="button"
          className="text-button"
          aria-disabled={!coach.busy}
          onClick={() => {
            if (!coach.busy) return;
            coach.cancel();
            document.getElementById('coach-generate')?.focus();
          }}
        >
          Cancel generation
        </button>
      </div>
      <p role="status">{coach.notice}</p>
      {coach.suggestion !== null && (
        <p className="field-hint">
          Choose Use suggestion or Keep original before generating another
          suggestion.
        </p>
      )}
      {coach.problem && (
        <div role="alert">
          <p>{coach.problem}</p>
          {coach.expired && (
            <button type="button" onClick={onSignIn}>
              Sign in again
            </button>
          )}
        </div>
      )}
      <CoachSuggestion coach={coach} />
    </section>
  );
}

/** @param {{coach: CoachState}} props */
function CoachFields({ coach }) {
  return (
    <>
      <label className="form-field" htmlFor="coach-action">
        <span>Coach task</span>
        <select
          id="coach-action"
          value={coach.action}
          disabled={coach.busy || coach.expired}
          onChange={(e) =>
            coach.setAction(
              /** @type {import('./api.js').CoachInput['action']} */ (
                e.target.value
              ),
            )
          }
        >
          <option value="draft">Draft from my intent</option>
          <option value="refine">Refine my message</option>
        </select>
      </label>
      {coach.action === 'draft' && (
        <label className="form-field" htmlFor="coach-intent">
          <span>What would you like to say?</span>
          <textarea
            id="coach-intent"
            rows={3}
            value={coach.intent}
            readOnly={coach.expired}
            aria-describedby="coach-length"
            onChange={(e) => coach.setIntent(e.target.value)}
          />
        </label>
      )}
      <label className="form-field" htmlFor="coach-tone">
        <span>Suggestion tone</span>
        <select
          id="coach-tone"
          value={coach.tone}
          disabled={coach.busy || coach.expired}
          onChange={(e) =>
            coach.setTone(
              /** @type {import('./api.js').CoachInput['tone']} */ (
                e.target.value
              ),
            )
          }
        >
          <option value="natural">Natural</option>
          <option value="warm">Warm</option>
          <option value="direct">Direct</option>
        </select>
      </label>
      <p className="field-hint" id="coach-length">
        Intent and suggestions need visible text, up to 5,000 characters; some
        emoji count as two. Refinement uses Your message.
      </p>
    </>
  );
}

/** @param {{coach: CoachState}} props */
function CoachSuggestion({ coach }) {
  const [confirming, setConfirming] = useState('');
  function choose() {
    if (coach.busy || coach.expired) return;
    if (confirming === 'apply') coach.apply();
    else coach.restore();
    setConfirming('');
    document.getElementById('invitation-message')?.focus();
  }
  function apply() {
    if (coach.changed) setConfirming('apply');
    else {
      coach.apply();
      document.getElementById('invitation-message')?.focus();
    }
  }
  function restore() {
    if (coach.restoreChanged) setConfirming('restore');
    else {
      coach.restore();
      document.getElementById('invitation-message')?.focus();
    }
  }
  return (
    <>
      {coach.suggestion !== null && (
        <SuggestionEditor
          coach={coach}
          onApply={apply}
          onKeep={() => {
            coach.cancel();
            coach.setSuggestion(null);
            setConfirming('');
            document.getElementById('invitation-message')?.focus();
          }}
        />
      )}
      {coach.previous && (
        <button
          type="button"
          className="text-button"
          disabled={coach.busy || coach.expired}
          onClick={restore}
        >
          Restore original message
        </button>
      )}
      {confirming && (
        <ReplaceConfirmation
          onReplace={choose}
          onKeep={() => {
            setConfirming('');
            document.getElementById('invitation-message')?.focus();
          }}
        />
      )}
    </>
  );
}

/** @param {{coach: CoachState, onApply: () => void, onKeep: () => void}} props */
function SuggestionEditor({ coach, onApply, onKeep }) {
  const text = coach.suggestion ?? '';
  return (
    <>
      <label className="form-field" htmlFor="coach-suggestion">
        <span>Suggested message</span>
        <textarea
          id="coach-suggestion"
          rows={5}
          value={text}
          readOnly={coach.busy || coach.expired}
          aria-describedby="coach-length"
          aria-invalid={!validCoachText(text) || undefined}
          onChange={(e) => coach.setSuggestion(e.target.value)}
        />
      </label>
      <div className="coach-actions">
        <button
          type="button"
          disabled={coach.busy || coach.expired || !validCoachText(text)}
          onClick={onApply}
        >
          Use suggestion
        </button>
        <button
          type="button"
          className="secondary-button"
          disabled={coach.busy || coach.expired}
          onClick={onKeep}
        >
          Keep original
        </button>
      </div>
    </>
  );
}

/** @param {{onReplace: () => void, onKeep: () => void}} props */
function ReplaceConfirmation({ onReplace, onKeep }) {
  const question = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  useEffect(() => {
    question.current?.focus();
  }, []);
  return (
    <div className="invitation-confirm">
      <p tabIndex={-1} ref={question}>
        Your message has changed. Replace the current message?
      </p>
      <div className="coach-actions">
        <button type="button" className="secondary-button" onClick={onKeep}>
          Keep current message
        </button>
        <button type="button" onClick={onReplace}>
          Replace current message
        </button>
      </div>
    </div>
  );
}
