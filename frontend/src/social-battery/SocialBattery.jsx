import { useState } from 'react';
import { BatteryIcon } from './BatteryIcon.jsx';
import { choices } from './api.js';
import { useBattery } from './useBattery.js';
import './social-battery.css';

/** @param {{onSignIn: () => void}} props */
export function SocialBattery({ onSignIn }) {
  const battery = useBattery('/api/users/me/social-battery');
  const [selected, setSelected] = useState(
    /** @type {import('./api.js').BatteryStatus | null} */ (null),
  );
  return (
    <section
      className="account-card social-battery"
      aria-labelledby="battery-title"
    >
      <h2 id="battery-title">Social Battery</h2>
      <p>
        Let your conversation partners know your communication availability.
      </p>
      <p className="field-hint">
        Only accepted conversation partners can see your saved status. It does
        not block invitations or messages. Your status stays until you change
        it.
      </p>
      {battery.loaded && (
        <p>
          Saved status:{' '}
          <strong>
            {choices.find((choice) => choice.value === battery.status)?.label ??
              'Not set'}
          </strong>
        </p>
      )}
      {battery.loading && <p role="status">Loading Social Battery…</p>}
      {battery.error && <p role="alert">{battery.error}</p>}
      <BatteryForm
        battery={battery}
        selected={selected}
        setSelected={setSelected}
      />
      <p role="status">{battery.notice}</p>
      {battery.expired ? (
        <button type="button" onClick={onSignIn}>
          Sign in again
        </button>
      ) : (
        battery.error && (
          <button
            type="button"
            className="secondary-button"
            onClick={battery.refresh}
          >
            Reload saved status
          </button>
        )
      )}
    </section>
  );
}

/** @param {{battery: ReturnType<typeof useBattery>, selected: import('./api.js').BatteryStatus | null, setSelected: (value: import('./api.js').BatteryStatus) => void}} props */
function BatteryForm({ battery, selected, setSelected }) {
  const value = selected ?? battery.status;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (value) void battery.save(value);
      }}
      aria-busy={battery.busy}
    >
      <fieldset
        disabled={
          battery.loading ||
          battery.busy ||
          battery.expired ||
          Boolean(battery.error && !selected)
        }
      >
        <legend>Choose your communication availability</legend>
        <div className="battery-choices">
          {choices.map((choice) => (
            <label
              className={`battery-choice battery-${choice.value}`}
              key={choice.value}
            >
              <BatteryIcon status={choice.value} segments={choice.segments} />
              <strong>{choice.label}</strong>
              <span>{choice.description}</span>
              <input
                type="radio"
                name="social-battery"
                value={choice.value}
                checked={value === choice.value}
                onChange={() =>
                  setSelected(
                    /** @type {import('./api.js').BatteryStatus} */ (
                      choice.value
                    ),
                  )
                }
              />
            </label>
          ))}
        </div>
        <button type="submit" disabled={!value}>
          {battery.busy ? 'Saving…' : 'Save Status'}
        </button>
      </fieldset>
    </form>
  );
}
