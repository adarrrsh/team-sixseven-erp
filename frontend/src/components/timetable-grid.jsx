import { DAYS, PERIODS } from "@/lib/data"
import { cn } from "cn"

const CODE_TONE = {
  CS: "bg-pink-soft text-pink-strong",
  EC: "bg-blue-soft text-blue-strong",
  ME: "bg-green-soft text-green-strong",
  CM: "bg-red-soft text-red-strong",
}

/**
 * One grid, three audiences: pass `show="faculty"` for the teacher view and
 * `highlight` to dim everything except one teacher's slots.
 */
export function TimetableGrid({ data, show = "room", highlight, className }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border", className)}>
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Period
            </th>
            {DAYS.map((d) => (
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
          {PERIODS.map((p, pi) => (
            <tr key={p} className="border-t border-border">
              <td className="px-3 py-2 text-xs font-medium text-muted-foreground tabular-nums">
                {p}
              </td>
              {DAYS.map((d) => {
                const slot = data[d]?.[pi]
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
