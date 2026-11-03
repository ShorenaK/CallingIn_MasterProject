/** @param {{status: string, segments: number}} props */
export function BatteryIcon({ status, segments }) {
  return (
    <svg
      className={`battery-icon battery-${status}`}
      viewBox="0 0 104 56"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className="battery-shell"
        x="3"
        y="6"
        width="88"
        height="44"
        rx="10"
      />
      <path className="battery-terminal" d="M94 21h5v14h-5z" />
      {[0, 1, 2, 3].map((index) => (
        <rect
          key={index}
          className={index < segments ? 'battery-filled' : 'battery-empty'}
          x={11 + index * 19}
          y="14"
          width="15"
          height="28"
          rx="4"
        />
      ))}
    </svg>
  );
}
