import { useEffect } from 'react';
import { choices } from './api.js';
import { BatteryIcon } from './BatteryIcon.jsx';
import { useBattery } from './useBattery.js';
import './social-battery.css';

/** @param {{roomId: string, name: string, expired: boolean, onExpired: () => void}} props */
export function PartnerBattery({ roomId, name, expired, onExpired }) {
  const battery = useBattery(
    `/api/conversations/${encodeURIComponent(roomId)}/social-battery`,
  );
  const choice = choices.find((entry) => entry.value === battery.status);
  useEffect(() => {
    if (battery.expired) onExpired();
  }, [battery.expired, onExpired]);
  if (expired || battery.expired) return null;
  return (
    <section
      className="partner-battery"
      aria-label={`${name}’s Social Battery`}
    >
      <p>
        <strong>{name}’s Social Battery</strong>
      </p>
      {battery.loading ? (
        <p role="status">Loading availability…</p>
      ) : battery.error ? (
        <p role="alert">{battery.error}</p>
      ) : (
        <p className="battery-summary">
          {choice && (
            <BatteryIcon status={choice.value} segments={choice.segments} />
          )}
          <span>{choice?.label ?? 'Not set'}</span>
        </p>
      )}
      <button
        type="button"
        className="secondary-button"
        disabled={expired || battery.loading}
        onClick={battery.refresh}
      >
        Refresh availability
      </button>
    </section>
  );
}
