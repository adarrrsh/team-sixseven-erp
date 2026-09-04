import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarDays, ChevronRight, ClipboardList, LayoutDashboard, Network as NetworkIcon, PenLine, Plane, Plus } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { LineChart } from "@/components/charts"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { TimetableGrid } from "@/components/timetable-grid"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Input, Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { AsyncBoundary, CardsSkeleton, ErrorState, Skeleton } from "@/components/async-boundary"
import { useApi, useApiAll } from "@/lib/use-api"
import {
  applyForLeave,
  getCourses,
  getExam,
  getExams,
  getExamScores,
  getFacultyAttendance,
  getFacultyMember,
  getLeaves,
  getStudents,
  getTimetable,
  publishScore,
  updateMarks,
} from "@/lib/api"
import { loadSession } from "@/lib/session"

const NAV = [
  { to: "/faculty", label: "Today", icon: LayoutDashboard, end: true },
  { heading: "Teaching" },
  { to: "/faculty/timetable", label: "My timetable", icon: CalendarDays },
  { to: "/faculty/marks", label: "Marks entry", icon: PenLine },
  { to: "/faculty/network", label: "Network", icon: NetworkIcon },
  { heading: "Me" },
  { to: "/faculty/leave", label: "Leave", icon: Plane },
  { to: "/faculty/duty", label: "Invigilation duty", icon: ClipboardList },
]

export default function FacultyPortal() {
  const navigate = useNavigate()
  const session = loadSession()

  // No stored session, or one that belongs to a different portal — bounce
  // back to the login page rather than rendering someone else's data.
  useEffect(() => {
    if (!session || session.role !== "faculty") navigate("/", { replace: true })
  }, [session, navigate])

  if (!session) return null

  return (
    <AppShell role="Faculty portal" nav={NAV} user={{ name: session.name, meta: session.email }}>
      <Routes>
        <Route index element={<Today />} />
        <Route path="timetable" element={<MyTimetable />} />
        <Route path="marks" element={<MarksExams />} />
        <Route path="marks/:examId" element={<AssignScores />} />
        <Route path="network" element={<Network />} />
        <Route path="leave" element={<Leave />} />
        <Route path="duty" element={<Duty />} />
      </Routes>
    </AppShell>
  )
}

function Today() {
  const session = loadSession()
  const { data, error, loading, refresh } = useApiAll(
    {
      courses: () => getCourses({ faculty: session?.name }),
      attendance: () => getFacultyAttendance(),
      timetable: () => getTimetable(),
      duties: () => getExams(),
    },
    [],
    { courses: [], attendance: null, timetable: null, duties: [] },
  )

  const mine = data.courses
  const me = data.attendance?.faculty.find((f) => f.name === session?.name)
  const grid = data.timetable?.timetable ?? {}
  const days = data.timetable?.days ?? []
  const todaysClasses = days.reduce(
    (n, d) => n + (grid[d] ?? []).filter((slot) => slot?.faculty === session?.name).length,
    0,
  )
  const myDuties = data.duties.filter((e) => e.invigilator === session?.name).length

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
              <LineChart data={data.attendance?.trend ?? []} tone="pink" />
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My courses</CardTitle>
            <CardDescription>
              {[...new Set(mine.map((c) => c.sem))].sort().map((s) => `Sem ${s}`).join(", ") || "This semester"}
            </CardDescription>
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
            highlight={session?.name}
          />
        </AsyncBoundary>
      </Section>
    </>
  )
}

function MyTimetable() {
  const session = loadSession()
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
          highlight={session?.name}
        />
      </AsyncBoundary>
    </>
  )
}

/**
 * An Obsidian-style graph of my teaching network, exactly two layers deep:
 * me at the centre, the courses I teach one ring out, and — a ring beyond
 * that — the students actually enrolled in each one (matched by a course's
 * own department and semester against the full student roster, the same
 * join the rest of the app uses to decide who's "in" a course).
 */
function Network() {
  const session = loadSession()
  const { data, error, loading, refresh } = useApiAll(
    {
      courses: () => getCourses({ faculty: session?.name }),
      students: () => getStudents(),
    },
    [],
    { courses: [], students: [] },
  )

  const mine = data.courses
  const enrolledIn = (course) =>
    data.students.filter((s) => s.dept === course.dept && s.sem === course.sem)

  const studentNodes = [...new Map(mine.flatMap((c) => enrolledIn(c).map((s) => [s.id, s]))).values()]

  const nodes = [
    { id: "me", label: (session?.name ?? "Me").replace("Dr. ", "").replace("Prof. ", ""), group: "me", val: 9 },
    ...mine.map((c) => ({ id: `course:${c.code}`, label: c.code, group: "course", val: 6 })),
    ...studentNodes.map((s) => ({ id: `student:${s.id}`, label: s.name, group: "student", val: 3 })),
  ]

  const links = [
    ...mine.map((c) => ({ source: "me", target: `course:${c.code}` })),
    ...mine.flatMap((c) =>
      enrolledIn(c).map((s) => ({ source: `course:${c.code}`, target: `student:${s.id}` })),
    ),
  ]

  return (
    <>
      <PageHeader
        title="Network"
        description="Courses I teach, and the students enrolled in each one — drag, scroll to zoom, click a node to focus."
      />
      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-[640px] w-full" />}>
        <KnowledgeGraph nodes={nodes} links={links} height={640} />
      </AsyncBoundary>
    </>
  )
}

function MarksExams() {
  const { data: exams, error, loading } = useApi(() => getExams(), [], [])
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Marks entry"
        description="Pick an exam to open its marks sheet."
      />
      <DataTable
        name="faculty-exams"
        rows={exams}
        onRowClick={(r) => navigate(`/faculty/marks/${r.id}`)}
        empty={loading ? "Loading…" : error ? "Could not load exams." : "No exams scheduled."}
        searchPlaceholder="Search exams…"
        columns={[
          { key: "id", header: "Exam" },
          { key: "title", header: "Title" },
          { key: "program", header: "Programme" },
          { key: "date", header: "Date" },
          { key: "students", header: "Students", align: "right" },
          { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          {
            key: "open",
            header: "",
            export: false,
            render: () => <ChevronRight className="size-4 text-muted-foreground" />,
          },
        ]}
      />
    </>
  )
}

/** One exam's marks sheet — the rows `GET /api/exams/:id/scores` already keys to it. */
function AssignScores() {
  const { examId } = useParams()
  const { data, error, loading, setData, refresh } = useApiAll(
    {
      exam: () => getExam(examId),
      scores: () => getExamScores(examId),
    },
    [examId],
    { exam: null, scores: [] },
  )
  const exam = data.exam
  const rows = data.scores

  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(null)

  const commit = async (row) => {
    const value = Number(draft[row.recordId])
    if (draft[row.recordId] === undefined || draft[row.recordId] === "" || Number.isNaN(value)) return

    setSaving(row.recordId)
    try {
      const updated = await updateMarks(row, value)
      setData((d) => ({
        ...d,
        scores: d.scores.map((r) => (r.recordId === updated.recordId ? updated : r)),
      }))
      setDraft((d) => ({ ...d, [row.recordId]: "" }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <PageHeader
        title={exam?.title ?? "Marks sheet"}
        description={exam ? `${exam.program} · ${exam.date} · ${rows.length} scored` : "Loading exam…"}
      >
        {exam ? (
          <AddScore
            exam={exam}
            existingRows={rows}
            onAdded={(created) =>
              setData((d) => ({ ...d, scores: [created, ...d.scores.filter((r) => r.recordId !== created.recordId)] }))
            }
          />
        ) : null}
        <Button asChild variant="outline" size="lg">
          <Link to="/faculty/marks">
            <ArrowLeft />
            All exams
          </Link>
        </Button>
      </PageHeader>
      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
        <DataTable
          name={`exam-${examId}-scores`}
          rows={rows}
          empty="No scores recorded for this exam yet."
          searchPlaceholder="Search students…"
          columns={[
            { key: "id", header: "Student ID" },
            { key: "name", header: "Name" },
            { key: "course", header: "Course" },
            { key: "grade", header: "Grade" },
            { key: "marks", header: "Current", align: "right", render: (r) => `${r.marks} / ${r.max}` },
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
                    max={r.max}
                    value={draft[r.recordId] ?? ""}
                    placeholder={String(r.marks)}
                    onChange={(e) => setDraft((d) => ({ ...d, [r.recordId]: e.target.value }))}
                  />
                  <Button size="xs" disabled={saving === r.recordId} onClick={() => commit(r)}>
                    {saving === r.recordId ? "…" : "Save"}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </AsyncBoundary>
    </>
  )
}

/**
 * `GET /exams/:id/scores` only ever returns students who already have a
 * score row — there was no way, anywhere in the app, to grade someone for
 * the first time (the backend's `POST /scores` upsert existed but nothing
 * called it). This closes that gap: pick one of my own courses, pick a
 * student in that course's cohort who isn't already on the sheet, enter
 * their marks.
 */
function AddScore({ exam, existingRows, onAdded }) {
  const session = loadSession()
  const { data: myCourses } = useApi(() => getCourses({ faculty: session?.name }), [session?.name], [])

  const [courseCode, setCourseCode] = useState("")
  const [studentId, setStudentId] = useState("")
  const [marks, setMarks] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const course = myCourses.find((c) => c.code === courseCode)
  const rosterQuery = useApi(
    () => (course ? getStudents({ dept: course.dept, sem: course.sem }) : Promise.resolve([])),
    [course?.dept, course?.sem],
    [],
  )
  const alreadyScored = new Set(existingRows.filter((r) => r.course === courseCode).map((r) => r.id))
  const unscored = rosterQuery.data.filter((s) => !alreadyScored.has(s.id))

  const reset = () => {
    setCourseCode("")
    setStudentId("")
    setMarks("")
    setError(null)
  }

  const submit = async () => {
    const student = rosterQuery.data.find((s) => s.id === studentId)
    if (!course || !student || marks === "") return
    setBusy(true)
    setError(null)
    try {
      const created = await publishScore({
        id: student.id,
        name: student.name,
        program: student.program,
        course: course.code,
        exam: exam.title,
        marks: Number(marks) || 0,
        max: 100,
      })
      onAdded(created)
      setStudentId("")
      setMarks("")
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog onOpenChange={(o) => !o && reset()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Plus />
          Add score
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a score</DialogTitle>
          <DialogDescription>For a student not yet on this exam's sheet.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="as-course">Course</Label>
            <Select
              value={courseCode}
              onValueChange={(v) => {
                setCourseCode(v)
                setStudentId("")
              }}
            >
              <SelectTrigger id="as-course">
                <SelectValue placeholder="Pick one of my courses" />
              </SelectTrigger>
              <SelectContent>
                {myCourses.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} · {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="as-student">Student</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={!course}>
              <SelectTrigger id="as-student">
                <SelectValue placeholder={course ? "Pick a student" : "Pick a course first"} />
              </SelectTrigger>
              <SelectContent>
                {unscored.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="as-marks">Marks out of 100</Label>
            <Input
              id="as-marks"
              type="number"
              min="0"
              max="100"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
            />
          </div>
        </div>

        {error ? <ErrorState error={error} /> : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">
              Cancel
            </Button>
          </DialogClose>
          <Button size="lg" disabled={busy || !course || !studentId || marks === ""} onClick={submit}>
            {busy ? "Saving…" : "Add score"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Leave() {
  const session = loadSession()
  const { data: rows, error, loading, setData: setRows } = useApi(
    () => getLeaves({ name: session?.name }),
    [session?.name],
    [],
  )
  // Only the leave form needs the department — worth its own small fetch
  // rather than threading it through every other page on this portal.
  const { data: me } = useApi(
    () => getFacultyMember(session?.linkedId),
    [session?.linkedId],
    null,
  )

  const apply = async (payload) => {
    const created = await applyForLeave(payload)
    setRows((rs) => [created, ...rs])
  }

  return (
    <>
      <PageHeader title="Leave" description="Apply for leave and track past requests.">
        <ApplyLeave onApply={apply} name={session?.name} dept={me?.dept} />
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

function ApplyLeave({ onApply, name, dept }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ type: "Casual", from: "", to: "", reason: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // The request ID and the day count are worked out by the backend. The
  // dialog only closes itself once that request actually succeeds — a
  // rejection (validation error, unreachable backend) stays on screen with
  // the reason, instead of the old behaviour of closing regardless and
  // dropping the error silently.
  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onApply({
        name,
        dept: dept ?? "—",
        type: form.type,
        from: form.from || "2026-09-20",
        to: form.to || "2026-09-21",
        reason: form.reason,
      })
      setForm({ type: "Casual", from: "", to: "", reason: "" })
      setOpen(false)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null) }}>
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

        {error ? <ErrorState error={error} /> : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">
              Cancel
            </Button>
          </DialogClose>
          <Button size="lg" disabled={busy} onClick={submit}>
            {busy ? "Submitting…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Duty() {
  const session = loadSession()
  const { data: exams, error, loading } = useApi(() => getExams(), [], [])
  const mine = exams.filter((e) => e.invigilator === session?.name)
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
