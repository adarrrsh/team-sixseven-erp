import { cn } from "cn"

const FILL = {
  pink: "var(--pink)",
  red: "var(--red)",
  green: "var(--green)",
  blue: "var(--blue)",
}

export function BarChart({ data, max = 100, tone = "pink", suffix = "%", className, height = 168 }) {
  const fill = FILL[tone]
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d) => {
          const h = Math.max(4, (d.value / max) * (height - 26))
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {d.value}
                {suffix}
              </span>
              <div
                className="w-full rounded-t-lg rounded-b-sm transition-[height] duration-500"
                style={{ height: h, background: fill }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 border-t border-border pt-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function LineChart({ data, max, tone = "pink", suffix = "%", className, height = 168 }) {
  const fill = FILL[tone]
  const top = max ?? Math.max(...data.map((d) => d.value), 1)
  const n = data.length
  const stepX = n > 1 ? 100 / (n - 1) : 0
  const pad = 12
  const yFor = (v) => pad + (1 - Math.min(v, top) / top) * (100 - pad * 2)
  const points = data.map((d, i) => [n > 1 ? i * stepX : 50, yFor(d.value)])
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")
  const areaPath = points.length
    ? `${linePath} L${points.at(-1)[0]},100 L${points[0][0]},100 Z`
    : ""

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full overflow-visible">
          <path d={areaPath} fill={fill} fillOpacity={0.12} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke={fill}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.4} fill={fill} stroke="var(--card)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {data.map((d, i) => (
          <span
            key={d.label}
            className="absolute -translate-x-1/2 text-xs font-medium text-muted-foreground tabular-nums"
            style={{ left: `${points[i][0]}%`, top: `calc(${points[i][1]}% - 20px)` }}
          >
            {d.value}
            {suffix}
          </span>
        ))}
      </div>
      <div className="flex gap-3 border-t border-border pt-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function DonutChart({ data, size = 168, thickness = 22, centerLabel, centerValue, className }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = 50 - thickness / 2
  const circumference = 2 * Math.PI * r

  const segments = data.reduce((rows, d) => {
    const dash = (d.value / total) * circumference
    const offset = rows.length ? rows.at(-1).offset + rows.at(-1).dash : 0
    return [...rows, { ...d, dash, offset }]
  }, [])

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
          {segments.map((d) => (
            <circle
              key={d.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={FILL[d.tone]}
              strokeWidth={thickness}
              strokeDasharray={`${d.dash} ${circumference - d.dash}`}
              strokeDashoffset={-d.offset}
            />
          ))}
        </svg>
        {centerValue != null ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tabular-nums">{centerValue}</span>
            {centerLabel ? <span className="text-xs text-muted-foreground">{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>
      <ul className="flex flex-col gap-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span className="size-2 shrink-0 rounded-full" style={{ background: FILL[d.tone] }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium tabular-nums">{d.display ?? d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RadialGauge({ value, max = 100, tone = "pink", suffix = "%", label, size = 168, thickness = 14, className }) {
  const r = 50 - thickness / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, max ? value / max : 0))
  const dash = pct * circumference

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={FILL[tone]}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-semibold tabular-nums"
            style={{ fontSize: Math.max(11, size * 0.15) }}
          >
            {value}
            {suffix}
          </span>
        </div>
      </div>
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
    </div>
  )
}

export function SplitBars({ data, className }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
        {data.map((d) => (
          <span
            key={d.label}
            style={{ width: `${(d.value / total) * 100}%`, background: FILL[d.tone] }}
            className="rounded-full"
          />
        ))}
      </div>
      <ul className="flex flex-col gap-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: FILL[d.tone] }}
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium tabular-nums">{d.display ?? d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
