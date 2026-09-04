import { Route, Routes } from "react-router-dom"
import { CalendarDays, ClipboardList, LayoutDashboard, PenLine, Plane, Users } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { BarChart } from "@/components/charts"
import { TimetableGrid } from "@/components/timetable-grid"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/primitives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Input, Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AsyncBoundary, CardsSkeleton, Skeleton } from "@/components/async-boundary"
import { useApi, useApiAll } from "@/lib/use-api"
import {
  applyForLeave,
  getCourses,
  getExams,
  getFacultyAttendance,
  getLeaves,
  getScores,
  getStudents,
  getTimetable,
  markAttendance,
  updateMarks,
} from "@/lib/api"

const ME = "Dr. Aparna Joshi"
const MY_DEPT = "Computer Science"

const NAV = [
  { to: "/faculty", label: "Today", icon: LayoutDashboard, end: true },
  { heading: "Teaching" },
  { to: "/faculty/timetable", label: "My timetable", icon: CalendarDays },
  { to: "/faculty/attendance", label: "Class attendance", icon: Users },
  { to: "/faculty/marks", label: "Marks entry", icon: PenLine },
  { heading: "Me" },
  { to: "/faculty/leave", label: "Leave", icon: Plane },
  { to: "/faculty/duty", label: "Invigilation duty", icon: ClipboardList },
]

export default function FacultyPortal() {
  return (
    <AppShell role="Faculty portal" nav={NAV} user={{ name: ME, meta: "Computer Science · FC-118" }}>
      <Routes>
        <Route index element={<Today />} />
        <Route path="timetable" element={<MyTimetable />} />
        <Route path="attendance" element={<ClassAttendance />} />
        <Route path="marks" element={<MarksEntry />} />
        <Route path="leave" element={<Leave />} />
        <Route path="duty" element={<Duty />} />
      </Routes>
    </AppShell>
  )
}

function Today() {
  const { data, error, loading, refresh } = useApiAll(
    {
      courses: () => getCourses({ faculty: ME }),
      attendance: () => getFacultyAttendance(),
      timetable: () => getTimetable(),
      duties: () => getExams(),
    },
    [],
    { courses: [], attendance: null, timetable: null, duties: [] },
  )

  const mine = data.courses
  const me = data.attendance?.faculty.find((f) => f.name === ME)
  const grid = data.timetable?.timetable ?? {}
  const days = data.timetable?.days ?? []
  const todaysClasses = days.reduce(
    (n, d) => n + (grid[d] ?? []).filter((slot) => slot?.faculty === ME).length,
    0,
  )
  const myDuties = data.duties.filter((e) => e.invigilator === ME).length

  return (
    <>
      <PageHeader title="Today" description="Your classes, duty and attendance at a glance." />
      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Classes this week" value={todaysClasses} hint={mine.map((c) => c.code).join(", ") || "—"} tone="pink" />
          <StatCard label="Courses taught" value={mine.length} hint={`${mine.reduce((n, c) => n + c.enrolled, 0)} students enrolled`} tone="blue" />
          <StatCard label="My attendance" value={me ? `${me.attendance}%` : "—"} hint="rolling 30 days" tone="green" />
          <StatCard label="Invigilation duty" value={myDuties} hint="assigned to me" tone="red" />
        </div>
      </AsyncBoundary>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>My attendance trend</CardTitle>
            <CardDescription>Monthly, as recorded by the registrar</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-44 w-full" />}>
              <BarChart data={data.attendance?.trend ?? []} tone="pink" />
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My courses</CardTitle>
            <CardDescription>Semester 5</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loading ? <Skeleton className="h-20 w-full" /> : null}
            {mine.map((c) => (
              <div key={c.code} className="flex flex-col gap-1.5 rounded-2xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge tone="pink">{c.code}</Badge>
                  <span className="text-sm font-medium">{c.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {c.enrolled} enrolled · {c.credits} credits
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Section title="Next classes" description="Straight from the institute timetable">
        <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
          <TimetableGrid
            data={grid}
            days={data.timetable?.days}
            periods={data.timetable?.periods}
            show="faculty"
            highlight={ME}
          />
        </AsyncBoundary>
      </Section>
    </>
  )
}

function MyTimetable() {
  const { data, error, loading, refresh } = useApi(() => getTimetable(), [], null)
  return (
    <>
      <PageHeader title="My timetable" description="Your slots are highlighted; the rest of the grid is dimmed." />
      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
        <TimetableGrid
          data={data?.timetable}
          days={data?.days}
          periods={data?.periods}
          show="faculty"
          highlight={ME}
        />
      </AsyncBoundary>
    </>
  )
}

function ClassAttendance() {
  const { data: roll, error, loading, setData: setRoll } = useApi(
    async () => {
      const rows = await getStudents({ dept: MY_DEPT })
      return rows.map((s) => ({ ...s, today: "Present" }))
    },
    [],
    [],
  )

  /**
   * Marking absent nudges the semester percentage down a point and persists it;
   * the registrar sees the same figure on the admin attendance tab.
   */
  const mark = async (id, value) => {
    const row = roll.find((r) => r.id === id)
    if (!row || row.today === value) return

    const next = Math.max(
      0,
      Math.min(100, value === "Absent" ? row.attendance - 1 : row.attendance + 1),
    )
    setRoll((rs) => rs.map((r) => (r.id === id ? { ...r, today: value, attendance: next } : r)))

    const updated = await markAttendance(id, next)
    setRoll((rs) => rs.map((r) => (r.id === id ? { ...updated, today: value } : r)))
  }

  return (
    <>
      <PageHeader
        title="Class attendance"
        description="CS-501 Distributed Systems · Wednesday, period 5"
      />
      <DataTable
        name="cs501-attendance"
        rows={roll}
        empty={loading ? "Loading…" : error ? "Could not load the roll." : "No students in this class."}
        searchPlaceholder="Search the roll…"
        columns={[
          { key: "id", header: "Student ID" },
          { key: "name", header: "Name" },
          { key: "attendance", header: "Semester %", align: "right" },
          {
            key: "bar",
            header: "Semester",
            export: false,
            render: (r) => (
              <div className="w-40">
                <Progress value={r.attendance} tone={r.attendance >= 85 ? "green" : r.attendance >= 75 ? "pink" : "red"} />
              </div>
            ),
          },
          { key: "today", header: "Today", render: (r) => <StatusBadge value={r.today} /> },
          {
            key: "mark",
            header: "Mark",
            export: false,
            render: (r) => (
              <div className="flex gap-1.5">
                <Button size="xs" variant={r.today === "Present" ? "default" : "outline"} onClick={() => mark(r.id, "Present")}>
                  Present
                </Button>
                <Button size="xs" variant={r.today === "Absent" ? "destructive" : "outline"} onClick={() => mark(r.id, "Absent")}>
                  Absent
                </Button>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

function MarksEntry() {
  const { data: rows, error, loading, setData: setRows } = useApi(
    async () => {
      const all = await getScores()
      return all.filter((s) => s.course.startsWith("CS"))
    },
    [],
    [],
  )
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(null)

  const commit = async (row) => {
    const value = Number(draft[row.id])
    if (draft[row.id] === undefined || draft[row.id] === "" || Number.isNaN(value)) return

    setSaving(row.id)
    try {
      const updated = await updateMarks(row, value)
      setRows((rs) => rs.map((r) => (r.recordId === updated.recordId ? updated : r)))
      setDraft((d) => ({ ...d, [row.id]: "" }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Marks entry"
        description="Mid-term · Semester 5. Marks publish to students once the registrar approves."
      />
      <DataTable
        name="cs-marks-entry"
        rows={rows}
        empty={loading ? "Loading…" : error ? "Could not load marks." : "No marks to enter."}
        searchPlaceholder="Search students…"
        columns={[
          { key: "id", header: "Student ID" },
          { key: "name", header: "Name" },
          { key: "course", header: "Course" },
          { key: "marks", header: "Current", align: "right", render: (r) => `${r.marks} / 100` },
          {
            key: "entry",
            header: "New marks",
            export: false,
            render: (r) => (
              <div className="flex items-center gap-1.5">
                <Input
                  className="h-8 w-20"
                  type="number"
                  min="0"
                  max="100"
                  value={draft[r.id] ?? ""}
                  placeholder={String(r.marks)}
                  onChange={(e) => setDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                />
                <Button size="xs" disabled={saving === r.id} onClick={() => commit(r)}>
                  {saving === r.id ? "…" : "Save"}
                </Button>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

function Leave() {
  const { data: rows, error, loading, setData: setRows } = useApi(
    () => getLeaves({ name: ME }),
    [],
    [],
  )

  const apply = async (payload) => {
    const created = await applyForLeave(payload)
    setRows((rs) => [created, ...rs])
  }

  return (
    <>
      <PageHeader title="Leave" description="Apply for leave and track past requests.">
        <ApplyLeave onApply={apply} />
      </PageHeader>
      <DataTable
        name="my-leave"
        rows={rows}
        searchPlaceholder="Search my requests…"
        empty={loading ? "Loading…" : error ? "Could not load your leave." : "No leave applied yet."}
        columns={[
          { key: "id", header: "Request" },
          { key: "type", header: "Type" },
          { key: "from", header: "From" },
          { key: "to", header: "To" },
          { key: "days", header: "Days", align: "right" },
          { key: "cover", header: "Cover" },
          { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  )
}

function ApplyLeave({ onApply }) {
  const [form, setForm] = useState({ type: "Casual", from: "", to: "", reason: "" })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // The request ID and the day count are worked out by the backend.
  const submit = async () => {
    setBusy(true)
    try {
      await onApply({
        name: ME,
        dept: MY_DEPT,
        type: form.type,
        from: form.from || "2026-09-20",
        to: form.to || "2026-09-21",
        reason: form.reason,
      })
      setForm({ type: "Casual", from: "", to: "", reason: "" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">Apply for leave</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for leave</DialogTitle>
          <DialogDescription>Goes to the registrar for approval.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="l-from">From</Label>
            <Input id="l-from" type="date" value={form.from} onChange={set("from")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="l-to">To</Label>
            <Input id="l-to" type="date" value={form.to} onChange={set("to")} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="l-reason">Reason</Label>
            <Textarea id="l-reason" value={form.reason} onChange={set("reason")} placeholder="Conference in Bengaluru" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="lg" disabled={busy} onClick={submit}>
              {busy ? "Submitting…" : "Submit"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Duty() {
  const { data: exams, error, loading } = useApi(() => getExams(), [], [])
  const mine = exams.filter((e) => e.invigilator === ME)
  return (
    <>
      <PageHeader title="Invigilation duty" description="Assigned by the examinations office." />
      <DataTable
        name="my-invigilation"
        rows={mine}
        searchPlaceholder="Search duty…"
        empty={loading ? "Loading…" : error ? "Could not load your duty." : "No duty assigned."}
        columns={[
          { key: "id", header: "Exam" },
          { key: "title", header: "Title" },
          { key: "date", header: "Date" },
          { key: "slot", header: "Slot" },
          { key: "room", header: "Room" },
          { key: "students", header: "Students", align: "right" },
          { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  )
}
