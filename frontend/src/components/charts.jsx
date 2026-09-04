import { cn } from "cn"

const FILL = {
  pink: "var(--pink)",
  red: "var(--red)",
  green: "var(--green)",
  blue: "var(--blue)",
}

/**
 * Small dependency-free bar chart — rounded bars, one flat colour.
 * data: [{ label, value }], values are 0–max.
 */
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

/** Horizontal breakdown bars — used for department / fee splits. */
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
