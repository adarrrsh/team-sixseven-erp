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
import {
  courses,
  exams,
  facultyAttendanceTrend,
  leaveRequests,
  scores as scoreSeed,
  students,
  timetable,
} from "@/lib/data"

const ME = "Dr. Aparna Joshi"

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
  const mine = courses.filter((c) => c.faculty === ME)
  return (
    <>
      <PageHeader title="Today" description="Wednesday, 2 September 2026 · 3 classes, 1 duty." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classes today" value="3" hint="CS-501, CS-503" tone="pink" />
        <StatCard label="Weekly load" value="18 h" hint="2 h above average" tone="blue" />
        <StatCard label="My attendance" value="96%" delta="+1%" hint="rolling 30 days" tone="green" />
        <StatCard label="Marks pending" value="2" hint="Mid-term · Sem 5" tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>My attendance trend</CardTitle>
            <CardDescription>Monthly, as recorded by the registrar</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={facultyAttendanceTrend} tone="pink" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My courses</CardTitle>
            <CardDescription>Semester 5</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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
        <TimetableGrid data={timetable} show="faculty" highlight={ME} />
      </Section>
    </>
  )
}

function MyTimetable() {
  return (
    <>
      <PageHeader title="My timetable" description="Your slots are highlighted; the rest of the grid is dimmed." />
      <TimetableGrid data={timetable} show="faculty" highlight={ME} />
    </>
  )
}

function ClassAttendance() {
  const [roll, setRoll] = useState(
    students
      .filter((s) => s.dept === "Computer Science")
      .map((s) => ({ ...s, today: "Present" })),
  )

  const mark = (id, value) =>
    setRoll((rs) => rs.map((r) => (r.id === id ? { ...r, today: value } : r)))

  return (
    <>
      <PageHeader
        title="Class attendance"
        description="CS-501 Distributed Systems · Wednesday, period 5"
      />
      <DataTable
        name="cs501-attendance"
        rows={roll}
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
  const [rows, setRows] = useState(scoreSeed.filter((s) => s.course.startsWith("CS")))
  const [draft, setDraft] = useState({})

  const commit = (id) => {
    const v = Number(draft[id])
    if (Number.isNaN(v)) return
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, marks: Math.max(0, Math.min(100, v)) } : r)))
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
                <Button size="xs" onClick={() => commit(r.id)}>
                  Save
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
  const [rows, setRows] = useState(leaveRequests.filter((l) => l.name === "Dr. Sneha Kulkarni" || l.name === ME))

  return (
    <>
      <PageHeader title="Leave" description="Apply for leave and track past requests.">
        <ApplyLeave onApply={(r) => setRows((rs) => [r, ...rs])} />
      </PageHeader>
      <DataTable
        name="my-leave"
        rows={rows}
        searchPlaceholder="Search my requests…"
        empty="No leave applied yet."
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
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

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
            <Button
              size="lg"
              onClick={() =>
                onApply({
                  id: "LV-" + Math.floor(3310 + Math.random() * 50),
                  name: ME,
                  dept: "Computer Science",
                  type: form.type,
                  from: form.from || "2026-09-20",
                  to: form.to || "2026-09-21",
                  days: 2,
                  cover: "—",
                  status: "Pending",
                })
              }
            >
              Submit
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Duty() {
  const mine = exams.filter((e) => e.invigilator === ME || e.invigilator === "Prof. Rajat Sinha")
  return (
    <>
      <PageHeader title="Invigilation duty" description="Assigned by the examinations office." />
      <DataTable
        name="my-invigilation"
        rows={mine}
        searchPlaceholder="Search duty…"
        empty="No duty assigned."
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
