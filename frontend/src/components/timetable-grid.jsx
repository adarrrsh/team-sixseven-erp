import { cn } from "cn"

/** Fallbacks for when the grid renders before the API response lands. */
const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const DEFAULT_PERIODS = [
  "09:00 – 09:55",
  "10:00 – 10:55",
  "11:10 – 12:05",
  "12:10 – 13:05",
  "14:00 – 14:55",
]

const CODE_TONE = {
  CS: "bg-pink-strong text-white",
  EC: "bg-blue-strong text-white",
  ME: "bg-green-strong text-white",
  CM: "bg-red-strong text-white",
}

/**
 * One grid, three audiences: pass `show="faculty"` for the teacher view and
 * `highlight` to dim everything except one teacher's slots.
 *
 * `days` and `periods` come from the timetable endpoint; they fall back to the
 * institute's standard week so the shell can render while the data loads.
 */
export function TimetableGrid({
  data,
  days = DEFAULT_DAYS,
  periods = DEFAULT_PERIODS,
  show = "room",
  highlight,
  className,
}) {
  const grid = data ?? {}
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border", className)}>
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Period
            </th>
            {days.map((d) => (
              <th
                key={d}
                className="px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p, pi) => (
            <tr key={p} className="border-t border-border">
              <td className="px-3 py-2 text-xs font-medium text-muted-foreground tabular-nums">
                {p}
              </td>
              {days.map((d) => {
                const slot = grid[d]?.[pi]
                const dim = highlight && slot && slot.faculty !== highlight
                return (
                  <td key={d} className="p-1.5 align-top">
                    {slot ? (
                      <div
                        className={cn(
                          "flex flex-col gap-0.5 rounded-xl px-2.5 py-2",
                          CODE_TONE[slot.code.slice(0, 2)],
                          dim && "bg-muted text-muted-foreground",
                        )}
                      >
                        <span className="text-xs font-semibold">{slot.code}</span>
                        <span className="text-[11px] opacity-80">
                          {show === "faculty" ? slot.faculty : slot.room}
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border px-2.5 py-2 text-[11px] text-muted-foreground">
                        Free
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
