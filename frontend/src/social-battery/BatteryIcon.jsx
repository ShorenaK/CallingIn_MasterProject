/** @param {{status: string, segments: number}} props */
export function BatteryIcon({ status, segments }) {
  return (
    <svg
      className={`battery-icon battery-${status}`}
      viewBox="0 0 112 52"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className="battery-shell"
        x="3"
        y="7"
        width="99"
        height="38"
        rx="10"
      />
      <rect
        className="battery-terminal"
        x="104"
        y="19"
        width="7"
        height="14"
        rx="2"
      />
      {[0, 1, 2].map((index) => {
        const fill = Math.min(Math.max(segments - index, 0), 1);
        return (
          <g key={index}>
            <rect
              className="battery-empty"
              x={11 + index * 29}
              y="14"
              width="25"
              height="24"
              rx="6"
            />
            {fill > 0 && (
              <rect
                className="battery-filled"
                x={11 + index * 29}
                y="14"
                width={25 * fill}
                height="24"
                rx="6"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
