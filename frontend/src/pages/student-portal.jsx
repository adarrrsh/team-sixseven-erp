import { useEffect, useState } from "react"
import { Route, Routes, useNavigate } from "react-router-dom"
import { BookOpen, CalendarCheck, CalendarDays, ClipboardList, LayoutDashboard, Network as NetworkIcon, Trophy, Wallet } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { BarChart, DonutChart, LineChart, RadialGauge } from "@/components/charts"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { TimetableGrid } from "@/components/timetable-grid"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Progress, Separator } from "@/components/ui/primitives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { AsyncBoundary, CardsSkeleton, ErrorState, Skeleton } from "@/components/async-boundary"
import { useApi } from "@/lib/use-api"
import { getAttendanceHistory, getStudentProfile, getTimetable, payStudentDue } from "@/lib/api"
import { loadSession } from "@/lib/session"
import { inr, pct } from "@/lib/utils"

/**
 * One call returns the signed-in student plus their fees, fines, scores,
 * courses and exams — keyed on `session.linkedId`, the Student.id the
 * backend attached to this account at login. Every page below calls this
 * instead of hardcoding whose record to show, so the portal always renders
 * whoever actually signed in.
 */
function useProfile() {
  const session = loadSession()
  const query = useApi(() => getStudentProfile(session?.linkedId), [session?.linkedId], null)
  return { ...query, session }
}

const NAV = [
  { to: "/student", label: "Overview", icon: LayoutDashboard, end: true },
  { heading: "Academics" },
  { to: "/student/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/student/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/student/courses", label: "Courses", icon: BookOpen },
  { to: "/student/exams", label: "Exams", icon: ClipboardList },
  { to: "/student/score", label: "Score", icon: Trophy },
  { to: "/student/network", label: "Network", icon: NetworkIcon },
  { heading: "Money" },
  { to: "/student/fees", label: "Fees & fines", icon: Wallet },
]

export default function StudentPortal() {
  const navigate = useNavigate()
  const session = loadSession()

  // No stored session, or one that belongs to a different portal — bounce
  // back to the login page rather than rendering someone else's data.
  useEffect(() => {
    if (!session || session.role !== "student") navigate("/", { replace: true })
  }, [session, navigate])

  if (!session) return null

  return (
    <AppShell role="Student portal" nav={NAV} user={{ name: session.name, meta: session.email }}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="timetable" element={<MyTimetable />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="courses" element={<MyCourses />} />
        <Route path="exams" element={<MyExams />} />
        <Route path="score" element={<MyScore />} />
        <Route path="network" element={<Network />} />
        <Route path="fees" element={<Fees />} />
      </Routes>
    </AppShell>
  )
}

function Overview() {
  const { data, error, loading, refresh, session } = useProfile()
  const timetableQuery = useApi(() => getTimetable(), [], null)

  const me = data?.student
  const myScores = data?.scores ?? []
  const nextDue = (data?.fees ?? []).find((f) => f.status !== "Paid")

  return (
    <>
      <PageHeader
        title={`Hello, ${(me?.name ?? session?.name ?? "there").split(" ")[0]}`}
        description={me ? `Semester ${me.sem} · ${me.program} · ${me.dept}` : "Loading your record…"}
      />

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Attendance"
            value={me ? `${me.attendance}%` : "—"}
            hint="75% needed for exams"
            tone={me && me.attendance >= 75 ? "green" : "red"}
          />
          <StatCard label="CGPA" value={me ? me.cgpa.toFixed(2) : "—"} hint="cumulative" tone="pink" />
          <StatCard
            label="Fees due"
            value={inr(me?.feesDue ?? 0)}
            hint={nextDue ? `due ${nextDue.due}` : "nothing outstanding"}
            tone="blue"
          />
          <StatCard label="Fines" value={inr(me?.fines ?? 0)} hint="unsettled" tone={me?.fines ? "red" : "green"} />
        </div>
      </AsyncBoundary>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Marks by course</CardTitle>
            <CardDescription>Published results this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-44 w-full" />}>
              <BarChart
                data={myScores.map((s) => ({ label: s.course, value: s.marks }))}
                tone={me && me.attendance >= 75 ? "green" : "red"}
              />
            </AsyncBoundary>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest marks</CardTitle>
            <CardDescription>Mid-term · Semester 5</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loading ? <Skeleton className="h-16 w-full" /> : null}
            {myScores.map((s) => (
              <div key={s.course} className="flex items-center gap-3">
                <Badge tone="pink">{s.course}</Badge>
                <div className="flex-1">
                  <Progress value={s.marks} tone={s.marks >= 85 ? "green" : s.marks >= 60 ? "blue" : "red"} />
                </div>
                <span className="text-sm font-medium tabular-nums">{s.marks}</span>
              </div>
            ))}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Attendance below 75% blocks exam registration — talk to your
              faculty advisor before 8 September.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CGPA tracker</CardTitle>
          <CardDescription>{me ? `Semester GPA, cumulative through semester ${me.sem}` : "Semester GPA, cumulative"}</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-64 w-full" />}>
            <LineChart
              data={(me?.sgpaTrend ?? []).map((s) => ({ label: `Sem ${s.sem}`, value: s.gpa }))}
              max={10}
              suffix=""
              tone="pink"
              height={260}
            />
          </AsyncBoundary>
        </CardContent>
      </Card>

      <Section title="This week" description="Your class timetable">
        <AsyncBoundary
          loading={timetableQuery.loading}
          error={timetableQuery.error}
          onRetry={timetableQuery.refresh}
          skeleton={<Skeleton className="h-72 w-full" />}
        >
          <TimetableGrid
            data={timetableQuery.data?.timetable}
            days={timetableQuery.data?.days}
            periods={timetableQuery.data?.periods}
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
      <PageHeader title="Timetable" description="Rooms update automatically when a class is reassigned." />
      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
        <TimetableGrid data={data?.timetable} days={data?.days} periods={data?.periods} />
      </AsyncBoundary>
    </>
  )
}

function MyCourses() {
  const { data, error, loading } = useProfile()
  const courses = data?.courses ?? []
  const credits = courses.reduce((n, c) => n + c.credits, 0)
  return (
    <>
      <PageHeader title="Courses" description={`Semester ${data?.student?.sem ?? "—"} registration — ${credits} credits.`} />
      <DataTable
        name="my-courses"
        rows={courses}
        empty={loading ? "Loading…" : error ? "Could not load your courses." : "No courses registered."}
        searchPlaceholder="Search my courses…"
        columns={[
          { key: "code", header: "Code" },
          { key: "title", header: "Title" },
          { key: "faculty", header: "Faculty" },
          { key: "credits", header: "Credits", align: "right" },
          { key: "enrolled", header: "Class size", align: "right" },
        ]}
      />
    </>
  )
}

function MyExams() {
  const { data, error, loading } = useProfile()
  return (
    <>
      <PageHeader title="Exams" description="Admit card is released 48 hours before each exam." />
      <DataTable
        name="my-exams"
        rows={data?.exams ?? []}
        empty={loading ? "Loading…" : error ? "Could not load your exams." : "No exams scheduled."}
        searchPlaceholder="Search exams…"
        columns={[
          { key: "id", header: "Exam" },
          { key: "title", header: "Title" },
          { key: "date", header: "Date" },
          { key: "slot", header: "Slot" },
          { key: "room", header: "Room" },
          { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  )
}

/**
 * An Obsidian-style graph of my academic network, exactly two layers deep:
 * me at the centre, the courses I'm registered for one ring out, and the
 * one professor teaching each course a ring beyond that. Built entirely
 * from the profile's own `courses` list — each course already carries its
 * teaching faculty's name, so no extra fetch is needed.
 */
function Network() {
  const { data, error, loading, refresh, session } = useProfile()
  const me = data?.student
  const courses = data?.courses ?? []
  const facultyNames = [...new Set(courses.map((c) => c.faculty).filter(Boolean))]

  const nodes = [
    { id: "me", label: (me?.name ?? session?.name ?? "Me").split(" ")[0], group: "me", val: 9 },
    ...courses.map((c) => ({ id: `course:${c.code}`, label: c.code, group: "course", val: 6 })),
    ...facultyNames.map((name) => ({ id: `faculty:${name}`, label: name, group: "faculty", val: 4 })),
  ]

  const links = [
    ...courses.map((c) => ({ source: "me", target: `course:${c.code}` })),
    ...courses.filter((c) => c.faculty).map((c) => ({ source: `course:${c.code}`, target: `faculty:${c.faculty}` })),
  ]

  return (
    <>
      <PageHeader
        title="Network"
        description="My courses, and the professor teaching each one — drag, scroll to zoom, click a node to focus."
      />
      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-[640px] w-full" />}>
        <KnowledgeGraph nodes={nodes} links={links} height={640} />
      </AsyncBoundary>
    </>
  )
}

const GRADE_ORDER = ["A+", "A", "B", "C", "D", "E"]
const GRADE_TONE = { "A+": "green", A: "green", B: "blue", C: "pink", D: "red", E: "red" }

function MyScore() {
  const { data, error, loading, refresh } = useProfile()
  const rows = data?.scores ?? []

  const byGrade = GRADE_ORDER.map((g) => ({
    label: g,
    value: rows.filter((r) => r.grade === g).length,
    tone: GRADE_TONE[g],
  })).filter((d) => d.value > 0)

  return (
    <>
      <PageHeader title="Score" description="Published marks across every exam." />

      {byGrade.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Grade distribution</CardTitle>
            <CardDescription>Across every published exam</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-64 w-full" />}>
              <DonutChart
                data={byGrade}
                centerValue={rows.length}
                centerLabel="results"
                size={240}
                thickness={30}
                className="justify-center"
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        name="my-score"
        rows={rows}
        empty={loading ? "Loading…" : error ? "Could not load your marks." : "No marks published yet."}
        searchPlaceholder="Search my marks…"
        columns={[
          { key: "exam", header: "Exam" },
          { key: "course", header: "Course" },
          { key: "marks", header: "Marks", align: "right", render: (r) => `${r.marks} / ${r.max}` },
          {
            key: "grade",
            header: "Grade",
            render: (r) => (
              <Badge tone={r.marks >= 85 ? "green" : r.marks >= 60 ? "blue" : "red"}>{r.grade}</Badge>
            ),
          },
        ]}
      />
    </>
  )
}

function Fees() {
  const { data, error, loading, refresh, session } = useProfile()
  const studentId = data?.student?.id ?? session?.linkedId

  const myFees = data?.fees ?? []
  const myFines = data?.fines ?? []
  const tuitionDue = myFees.reduce((s, f) => s + (f.payable - f.paid), 0)
  const finesDue = myFines
    .filter((f) => f.status === "Unpaid")
    .reduce((s, f) => s + f.amount, 0)
  const paidSoFar = myFees.reduce((s, f) => s + f.paid, 0)

  const nextHead = myFees.find((f) => f.status !== "Paid")

  return (
    <>
      <PageHeader title="Fees & fines" description="Pay semester fees and settle fines online.">
        <PayDialog
          label="Pay semester fees"
          studentId={studentId}
          amount={nextHead ? nextHead.payable - nextHead.paid : 0}
          head={nextHead?.head}
          disabled={!nextHead}
          onPaid={refresh}
        />
        <PayDialog
          label="Pay fines"
          studentId={studentId}
          variant="outline"
          amount={finesDue}
          disabled={finesDue === 0}
          onPaid={refresh}
        />
      </PageHeader>

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton count={3} />}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Tuition due"
            value={inr(tuitionDue)}
            hint={nextHead ? `due ${nextHead.due}` : "nothing outstanding"}
            tone={tuitionDue ? "red" : "green"}
          />
          <StatCard label="Fines due" value={inr(finesDue)} hint="library + hostel" tone={finesDue ? "pink" : "green"} />
          <StatCard label="Paid so far" value={inr(paidSoFar)} hint="all heads" tone="green" />
        </div>
      </AsyncBoundary>

      {myFees.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Paid vs due</CardTitle>
            <CardDescription>Across every fee head this semester</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-64 w-full" />}>
              <DonutChart
                data={[
                  { label: "Paid", value: paidSoFar, tone: "green", display: inr(paidSoFar) },
                  { label: "Due", value: tuitionDue, tone: tuitionDue ? "red" : "green", display: inr(tuitionDue) },
                ]}
                centerValue={`${pct(paidSoFar, paidSoFar + tuitionDue)}%`}
                centerLabel="paid"
                size={240}
                thickness={30}
                className="justify-center"
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      ) : null}

      <Section title="Fee heads">
        <DataTable
          name="my-fees"
          rows={myFees}
          empty={loading ? "Loading…" : error ? "Could not load your fees." : "No fee heads raised."}
          searchPlaceholder="Search fee heads…"
          columns={[
            { key: "head", header: "Head" },
            { key: "payable", header: "Payable", align: "right", render: (r) => inr(r.payable) },
            { key: "paid", header: "Paid", align: "right", render: (r) => inr(r.paid) },
            { key: "due", header: "Due date" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
        />
      </Section>

      <Section title="Fines">
        <DataTable
          name="my-fines"
          rows={myFines}
          searchPlaceholder="Search fines…"
          empty={loading ? "Loading…" : error ? "Could not load your fines." : "No fines — well played."}
          columns={[
            { key: "id", header: "Fine" },
            { key: "reason", header: "Reason" },
            { key: "amount", header: "Amount", align: "right", render: (r) => inr(r.amount) },
            { key: "raised", header: "Raised" },
            { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
          ]}
        />
      </Section>
    </>
  )
}

function PayDialog({ label, studentId, amount, head, onPaid, disabled, variant = "default" }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)

  // Omitting `head` tells the backend to settle outstanding fines instead.
  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await payStudentDue({ studentId, head, amount })
      setDone(res)
      onPaid()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      onOpenChange={(o) => {
        if (!o) {
          setDone(null)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" variant={variant} disabled={disabled}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            {head} · {inr(amount)} · dummy gateway in test mode
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-green-strong p-4 text-white">
            <span className="text-sm font-semibold">Payment successful</span>
            <span className="text-sm">Reference {done.reference}</span>
            {done.offline ? (
              <span className="text-xs">Backend unreachable — receipt generated locally.</span>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-card">Card number</Label>
              <Input id="p-card" defaultValue="4242 4242 4242 4242" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-exp">Expiry</Label>
              <Input id="p-exp" defaultValue="09/29" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-cvv">CVV</Label>
              <Input id="p-cvv" defaultValue="123" />
            </div>
          </div>
        )}

        {error ? <ErrorState error={error} /> : null}

        <DialogFooter>
          {done ? (
            <DialogClose asChild>
              <Button size="lg">Done</Button>
            </DialogClose>
          ) : (
            <>
              <DialogClose asChild>
                <Button variant="outline" size="lg">
                  Cancel
                </Button>
              </DialogClose>
              <Button size="lg" disabled={busy} onClick={run}>
                {busy ? "Processing…" : `Pay ${inr(amount)}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


/**
 * The student's own attendance tracker.
 *
 * Reads the same register the gate readers write to, so what shows here is
 * exactly what their card recorded — including whether they clear the 75%
 * threshold needed to sit exams.
 */
function MyAttendance() {
  const session = loadSession()
  const { data, error, loading, refresh } = useApi(
    () => getAttendanceHistory(session?.linkedId),
    [session?.linkedId],
    null,
  )

  const percentage = data?.percentage ?? 0
  const tone = percentage >= 85 ? "green" : percentage >= 75 ? "pink" : "red"

  // Consecutive days they would need to attend to climb back over 75%.
  const shortfall = data
    ? Math.max(0, Math.ceil((0.75 * data.days - data.present) / 0.25))
    : 0

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Recorded when you tap in at the gate. 75% is needed to sit exams."
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={<CardsSkeleton count={4} />}
      >
        {data ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Attendance" value={`${percentage}%`} hint={`${data.days} days recorded`} tone={tone} />
              <StatCard label="Days present" value={data.present} hint="tapped in" tone="green" />
              <StatCard label="Days absent" value={data.absent} hint="no record that day" tone={data.absent ? "red" : "green"} />
              <StatCard label="Current streak" value={`${data.streak}d`} hint="consecutive days present" tone="blue" />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Exam eligibility</CardTitle>
                  <CardDescription>
                    {data.eligible ? "You are clear to sit exams" : "Below the 75% threshold"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <RadialGauge value={percentage} tone={tone} label="attended" />
                  {data.eligible ? (
                    <Badge tone="green">Eligible</Badge>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Badge tone="red">At risk</Badge>
                      <span className="text-center text-xs text-muted-foreground">
                        Attend the next {shortfall} session{shortfall === 1 ? "" : "s"} to clear 75%.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Recent days</CardTitle>
                  <CardDescription>Each bar is one day — full means present</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart data={data.trend} tone={tone} suffix="" />
                </CardContent>
              </Card>
            </div>

            <Section title="Day-by-day" description="Your full attendance record">
              <DataTable
                name="my-attendance"
                rows={data.records}
                empty="Nothing recorded yet."
                searchPlaceholder="Search by date…"
                columns={[
                  { key: "date", header: "Date" },
                  {
                    key: "status",
                    header: "Status",
                    render: (r) => (
                      <Badge tone={r.status === "Present" ? "green" : "red"}>{r.status}</Badge>
                    ),
                  },
                  {
                    key: "firstSeen",
                    header: "Tapped in",
                    render: (r) =>
                      r.firstSeen
                        ? new Date(r.firstSeen).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—",
                  },
                  { key: "reader", header: "Gate", render: (r) => r.reader || "—" },
                ]}
              />
            </Section>
          </div>
        ) : null}
      </AsyncBoundary>
    </>
  )
}
