import { useState } from "react"
import { CalendarCheck, CheckCircle2, Lock, XCircle } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { StatCard } from "@/components/stat-card"
import { AsyncBoundary, CardsSkeleton, ErrorState } from "@/components/async-boundary"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiAll } from "@/lib/use-api"
import {
  closeAttendanceDay,
  getAttendance,
  getFaculty,
  getStudents,
  setAttendance,
} from "@/lib/api"

const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)

const clock = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"

export function AttendanceRegister({ holderType = "student" }) {
  const [date, setDate] = useState(today())
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const { data, loading, error: loadError, refresh } = useApiAll(
    {
      register: () => getAttendance({ date, holderType }),
      people: () => (holderType === "faculty" ? getFaculty() : getStudents()),
    },
    [date, holderType],
    { register: [], people: [] },
  )

  const rows = data.people.map((person) => {
    const record = data.register.find((r) => r.holderId === person.id)
    return {
      id: person.id,
      name: person.name,
      dept: person.dept,
      percentage: person.attendance,
      status: record?.status ?? "No record",
      firstSeen: record?.firstSeen ?? "",
      lastSeen: record?.lastSeen ?? "",
      scans: record?.scans ?? 0,
      reader: record?.reader || "—",
      source: record?.source ?? "",
    }
  })

  const present = rows.filter((r) => r.status === "Present").length
  const absent = rows.filter((r) => r.status === "Absent").length
  const unrecorded = rows.length - present - absent

  const mark = async (holderId, status) => {
    setBusy(holderId)
    setError(null)
    try {
      await setAttendance(holderId, { date, status, holderType })
      refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(null)
    }
  }

  const closeDay = async () => {
    setBusy("close")
    setError(null)
    try {
      await closeAttendanceDay(date, holderType)
      refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`reg-date-${holderType}`}>Register for</Label>
          <Input
            id={`reg-date-${holderType}`}
            type="date"
            className="w-44"
            value={date}
            onChange={(e) => setDate(e.target.value || today())}
          />
        </div>
        <Button
          variant="outline"
          size="lg"
          disabled={busy === "close" || loading}
          onClick={closeDay}
          title="Mark everyone without a record absent for this date"
        >
          <Lock />
          {busy === "close" ? "Closing…" : "Close day"}
        </Button>
        {unrecorded > 0 ? (
          <span className="text-xs text-muted-foreground">
            {unrecorded} not yet recorded — closing the day marks them absent.
          </span>
        ) : null}
      </div>

      {error ? <ErrorState error={error} /> : null}

      <AsyncBoundary
        loading={loading}
        error={loadError}
        onRetry={refresh}
        skeleton={<CardsSkeleton count={3} />}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Present" value={present} hint={date} tone="green" />
          <StatCard label="Absent" value={absent} hint="marked or closed out" tone="red" />
          <StatCard label="No record" value={unrecorded} hint="never tapped in" tone="pink" />
        </div>
      </AsyncBoundary>

      <DataTable
        name={`${holderType}-register-${date}`}
        rows={rows}
        empty={loading ? "Loading…" : "Nobody on this register yet."}
        searchPlaceholder="Search the register…"
        columns={[
          { key: "id", header: holderType === "faculty" ? "Staff ID" : "Student ID" },
          { key: "name", header: "Name" },
          { key: "dept", header: "Department" },
          {
            key: "status",
            header: "That day",
            render: (r) => (
              <Badge
                tone={r.status === "Present" ? "green" : r.status === "Absent" ? "red" : "pink"}
              >
                {r.status}
              </Badge>
            ),
          },
          { key: "firstSeen", header: "In", render: (r) => clock(r.firstSeen) },
          { key: "lastSeen", header: "Last seen", render: (r) => clock(r.lastSeen) },
          { key: "scans", header: "Taps", align: "right" },
          { key: "reader", header: "Reader" },
          { key: "percentage", header: "Term %", align: "right", render: (r) => `${r.percentage}%` },
          {
            key: "mark",
            header: "Correct",
            export: false,
            render: (r) => (
              <div className="flex gap-1.5">
                <Button
                  size="xs"
                  variant={r.status === "Present" ? "default" : "outline"}
                  disabled={busy === r.id}
                  onClick={() => mark(r.id, "Present")}
                >
                  <CheckCircle2 />
                  Present
                </Button>
                <Button
                  size="xs"
                  variant={r.status === "Absent" ? "destructive" : "outline"}
                  disabled={busy === r.id}
                  onClick={() => mark(r.id, "Absent")}
                >
                  <XCircle />
                  Absent
                </Button>
              </div>
            ),
          },
        ]}
        toolbar={
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarCheck className="size-3.5" />
            Written by the gate readers
          </span>
        }
      />
    </div>
  )
}
