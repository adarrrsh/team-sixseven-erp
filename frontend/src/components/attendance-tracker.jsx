import { useState } from "react"
import { CalendarRange, TrendingDown, TrendingUp, Users } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { StatCard } from "@/components/stat-card"
import { LineChart } from "@/components/charts"
import { AsyncBoundary, CardsSkeleton, Skeleton } from "@/components/async-boundary"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/primitives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApi, useApiAll } from "@/lib/use-api"
import { getAttendanceHistory, getAttendanceSummary, getAttendanceTrend } from "@/lib/api"

const THRESHOLD = 75

const tone = (pct) => (pct >= 85 ? "green" : pct >= THRESHOLD ? "pink" : "red")

export function AttendanceTracker({ holderType = "student" }) {
  const [openFor, setOpenFor] = useState(null)

  const { data, loading, error, refresh } = useApiAll(
    {
      summary: () => getAttendanceSummary(holderType),
      trend: () => getAttendanceTrend(holderType, 14),
    },
    [holderType],
    { summary: [], trend: [] },
  )

  const rows = data.summary
  const average = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.percentage, 0) / rows.length)
    : 0
  const atRisk = rows.filter((r) => r.percentage < THRESHOLD)
  const best = rows.reduce((a, b) => (!a || b.percentage > a.percentage ? b : a), null)
  const daysTracked = data.trend.length

  return (
    <div className="flex flex-col gap-4">
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={<CardsSkeleton />}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Average attendance"
            value={`${average}%`}
            hint={`${daysTracked} days on the register`}
            icon={Users}
            tone={tone(average)}
          />
          <StatCard
            label={`Below ${THRESHOLD}%`}
            value={atRisk.length}
            hint="exam-eligibility risk"
            icon={TrendingDown}
            tone={atRisk.length ? "red" : "green"}
          />
          <StatCard
            label="Best attendance"
            value={best ? `${best.percentage}%` : "—"}
            hint={best?.name ?? "no records yet"}
            icon={TrendingUp}
            tone="green"
          />
          <StatCard
            label="Tracked"
            value={rows.length}
            hint={holderType === "faculty" ? "staff on register" : "students on register"}
            icon={CalendarRange}
            tone="blue"
          />
        </div>
      </AsyncBoundary>

      <Card>
        <CardHeader>
          <CardTitle>Daily turnout</CardTitle>
          <CardDescription>
            Percentage of the cohort present each day, last {daysTracked || 14} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncBoundary
            loading={loading}
            error={error}
            onRetry={refresh}
            skeleton={<Skeleton className="h-44 w-full" />}
          >
            <LineChart data={data.trend} tone="pink" />
          </AsyncBoundary>
        </CardContent>
      </Card>

      <DataTable
        name={`${holderType}-attendance-tracker`}
        rows={rows}
        empty={loading ? "Loading…" : "Nothing on the register yet."}
        searchPlaceholder="Search by name or ID…"
        columns={[
          { key: "holderId", header: holderType === "faculty" ? "Staff ID" : "Student ID" },
          { key: "name", header: "Name" },
          { key: "dept", header: "Department" },
          { key: "present", header: "Present", align: "right" },
          { key: "absent", header: "Absent", align: "right" },
          { key: "days", header: "Days", align: "right" },
          {
            key: "percentage",
            header: "Attendance",
            align: "right",
            render: (r) => `${r.percentage}%`,
          },
          {
            key: "bar",
            header: "",
            export: false,
            render: (r) => (
              <div className="w-40">
                <Progress value={r.percentage} tone={tone(r.percentage)} />
              </div>
            ),
          },
          {
            key: "eligible",
            header: "Exam eligible",
            render: (r) => (
              <Badge tone={r.percentage >= THRESHOLD ? "green" : "red"}>
                {r.percentage >= THRESHOLD ? "Eligible" : "At risk"}
              </Badge>
            ),
          },
          {
            key: "history",
            header: "",
            export: false,
            render: (r) => (
              <Button size="xs" variant="outline" onClick={() => setOpenFor(r)}>
                History
              </Button>
            ),
          },
        ]}
      />

      <HistoryDialog
        holderType={holderType}
        row={openFor}
        onClose={() => setOpenFor(null)}
      />
    </div>
  )
}

function HistoryDialog({ row, holderType, onClose }) {
  const { data, loading, error, refresh } = useApi(
    () => (row ? getAttendanceHistory(row.holderId, holderType) : Promise.resolve(null)),
    [row?.holderId, holderType],
    null,
  )

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row?.name ?? "Attendance history"}</DialogTitle>
          <DialogDescription>
            {row ? `${row.holderId} · ${row.dept}` : ""}
          </DialogDescription>
        </DialogHeader>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={refresh}
          skeleton={<Skeleton className="h-52 w-full" />}
        >
          {data ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <Figure label="Attendance" value={`${data.percentage}%`} tone={tone(data.percentage)} />
                <Figure label="Present" value={data.present} />
                <Figure label="Absent" value={data.absent} />
                <Figure label="Current streak" value={`${data.streak}d`} />
              </div>

              <LineChart data={data.trend} tone={tone(data.percentage)} suffix="" />

              <div className="max-h-56 overflow-y-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {data.records.map((rec) => (
                      <tr key={rec.date} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 tabular-nums">{rec.date}</td>
                        <td className="px-3 py-2">
                          <Badge tone={rec.status === "Present" ? "green" : "red"}>
                            {rec.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {rec.reader || (rec.source === "manual" ? "marked by hand" : "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </AsyncBoundary>
      </DialogContent>
    </Dialog>
  )
}

function Figure({ label, value, tone: t }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-secondary p-3">
      <span className="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className={`text-lg font-semibold ${t === "red" ? "text-red-strong" : ""}`}>
        {value}
      </span>
    </div>
  )
}
