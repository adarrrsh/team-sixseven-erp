/**
 * Login hero — an SVG mock of a macOS-style window showing the admin
 * dashboard. Rounded rectangles and circles only, no gradients.
 */
export function HeroWindow({ className }) {
  const bar = (x, y, w, h, fill, r = 4) => (
    <rect key={`${x}-${y}-${w}`} x={x} y={y} width={w} height={h} rx={r} fill={fill} />
  )
  const pink = "var(--pink)"
  const blue = "var(--blue)"
  const green = "var(--green)"
  const red = "var(--red)"
  const line = "var(--border)"
  const soft = "var(--muted)"

  return (
    <svg
      viewBox="0 0 560 380"
      className={className}
      role="img"
      aria-label="Preview of the Origin admin dashboard"
    >
      <rect x="8" y="8" width="544" height="364" rx="22" fill="var(--card)" stroke={line} />
      {/* title bar */}
      <rect x="8" y="8" width="544" height="40" rx="22" fill="var(--secondary)" />
      <rect x="8" y="36" width="544" height="12" fill="var(--secondary)" />
      <line x1="8" y1="48" x2="552" y2="48" stroke={line} />
      <circle cx="34" cy="28" r="6" fill={red} />
      <circle cx="54" cy="28" r="6" fill={pink} />
      <circle cx="74" cy="28" r="6" fill={green} />
      {bar(240, 21, 96, 14, "var(--card)", 7)}

      {/* sidebar */}
      {bar(24, 64, 108, 292, soft, 14)}
      {bar(36, 78, 60, 10, pink, 5)}
      {[104, 126, 148, 170, 192, 214].map((y, i) =>
        bar(36, y, i === 1 ? 84 : 72, 8, "var(--border)", 4),
      )}
      {bar(36, 126, 84, 8, blue, 4)}

      {/* stat cards */}
      {[148, 282, 416].map((x, i) => (
        <g key={x}>
          <rect x={x} y="64" width="120" height="70" rx="14" fill="var(--card)" stroke={line} />
          {bar(x + 14, 78, 44, 7, "var(--border)", 3)}
          {bar(x + 14, 93, 62, 13, [pink, blue, green][i], 6)}
          {bar(x + 14, 114, 36, 6, soft, 3)}
        </g>
      ))}

      {/* chart card */}
      <rect x="148" y="148" width="254" height="208" rx="16" fill="var(--card)" stroke={line} />
      {bar(164, 164, 72, 8, "var(--border)", 4)}
      {[
        [174, 96],
        [204, 132],
        [234, 74],
        [264, 152],
        [294, 116],
        [324, 168],
        [354, 88],
      ].map(([x, h]) => bar(x, 336 - h, 18, h, pink, 6))}
      <line x1="164" y1="338" x2="386" y2="338" stroke={line} />

      {/* graph card — nodes + links, the flagship view */}
      <rect x="416" y="148" width="120" height="208" rx="16" fill="var(--card)" stroke={line} />
      <line x1="476" y1="196" x2="446" y2="252" stroke={line} strokeWidth="1.5" />
      <line x1="476" y1="196" x2="506" y2="252" stroke={line} strokeWidth="1.5" />
      <line x1="446" y1="252" x2="462" y2="312" stroke={line} strokeWidth="1.5" />
      <line x1="506" y1="252" x2="492" y2="312" stroke={line} strokeWidth="1.5" />
      <circle cx="476" cy="196" r="11" fill={pink} />
      <circle cx="446" cy="252" r="8" fill={blue} />
      <circle cx="506" cy="252" r="8" fill={blue} />
      <circle cx="462" cy="312" r="6" fill={green} />
      <circle cx="492" cy="312" r="6" fill={green} />
      {bar(432, 164, 52, 8, "var(--border)", 4)}
    </svg>
  )
}
