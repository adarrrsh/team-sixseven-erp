import { useState } from "react"
import { Route, Routes } from "react-router-dom"
import { BookOpen, CalendarDays, ClipboardList, LayoutDashboard, Trophy, Wallet } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { BarChart } from "@/components/charts"
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
import { courses, exams, fines, scores, studentFees, timetable } from "@/lib/data"
import { payStudentDue } from "@/lib/api"
import { inr } from "@/lib/utils"

const ME = { id: "ST-8802", name: "Vivaan Gupta", program: "B.Tech CSE", sem: 5 }

const NAV = [
  { to: "/student", label: "Overview", icon: LayoutDashboard, end: true },
  { heading: "Academics" },
  { to: "/student/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/student/courses", label: "Courses", icon: BookOpen },
  { to: "/student/exams", label: "Exams", icon: ClipboardList },
  { to: "/student/score", label: "Score", icon: Trophy },
  { heading: "Money" },
  { to: "/student/fees", label: "Fees & fines", icon: Wallet },
]

export default function StudentPortal() {
  return (
    <AppShell role="Student portal" nav={NAV} user={{ name: ME.name, meta: `${ME.program} · ${ME.id}` }}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="timetable" element={<MyTimetable />} />
        <Route path="courses" element={<MyCourses />} />
        <Route path="exams" element={<MyExams />} />
        <Route path="score" element={<MyScore />} />
        <Route path="fees" element={<Fees />} />
      </Routes>
    </AppShell>
  )
}

function Overview() {
  const myScores = scores.filter((s) => s.id === ME.id)
  return (
    <>
      <PageHeader
        title={`Hello, ${ME.name.split(" ")[0]}`}
        description="Semester 5 · B.Tech Computer Science & Engineering"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance" value="74%" delta="-3%" hint="75% needed for exams" tone="red" />
        <StatCard label="CGPA" value="7.10" hint="after semester 4" tone="pink" />
        <StatCard label="Fees due" value={inr(42000)} hint="due 10 September" tone="blue" />
        <StatCard label="Fines" value={inr(500)} hint="library overdue" tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Attendance by month</CardTitle>
            <CardDescription>Semester 5 so far</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { label: "Jul", value: 81 },
                { label: "Aug", value: 76 },
                { label: "Sep", value: 68 },
              ]}
              tone="red"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest marks</CardTitle>
            <CardDescription>Mid-term · Semester 5</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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

      <Section title="This week" description="Your class timetable">
        <TimetableGrid data={timetable} />
      </Section>
    </>
  )
}

function MyTimetable() {
  return (
    <>
      <PageHeader title="Timetable" description="Rooms update automatically when a class is reassigned." />
      <TimetableGrid data={timetable} />
    </>
  )
}

function MyCourses() {
  return (
    <>
      <PageHeader title="Courses" description="Semester 5 registration — 19 credits." />
      <DataTable
        name="my-courses"
        rows={courses.filter((c) => c.dept === "Computer Science" || c.sem === ME.sem)}
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
  return (
    <>
      <PageHeader title="Exams" description="Admit card is released 48 hours before each exam." />
      <DataTable
        name="my-exams"
        rows={exams.filter((e) => e.program === ME.program)}
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

function MyScore() {
  const mine = scores.filter((s) => s.id === ME.id)
  return (
    <>
      <PageHeader title="Score" description="Published marks across every exam." />
      <DataTable
        name="my-score"
        rows={mine}
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
  const [paidHeads, setPaidHeads] = useState([])
  const myFees = studentFees
    .filter((f) => f.id === ME.id)
    .map((f) => (paidHeads.includes(f.head) ? { ...f, paid: f.payable, status: "Paid" } : f))
  const myFines = fines
    .filter((f) => f.student === ME.name)
    .map((f) => (paidHeads.includes(f.id) ? { ...f, status: "Paid" } : f))

  return (
    <>
      <PageHeader title="Fees & fines" description="Pay semester fees and settle fines online.">
        <PayDialog
          label="Pay semester fees"
          amount={42000}
          head="Semester 5 tuition"
          onPaid={() => setPaidHeads((p) => [...p, "Semester 5 tuition"])}
        />
        <PayDialog
          label="Pay fines"
          variant="outline"
          amount={500}
          head="FN-201"
          onPaid={() => setPaidHeads((p) => [...p, "FN-201"])}
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tuition due" value={inr(myFees.reduce((s, f) => s + (f.payable - f.paid), 0))} hint="due 10 September" tone="red" />
        <StatCard label="Fines due" value={inr(myFines.filter((f) => f.status === "Unpaid").reduce((s, f) => s + f.amount, 0))} hint="library + hostel" tone="pink" />
        <StatCard label="Paid this year" value={inr(84000)} hint="semesters 3 – 4" tone="green" />
      </div>

      <Section title="Fee heads">
        <DataTable
          name="my-fees"
          rows={myFees}
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
          empty="No fines — well played."
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

function PayDialog({ label, amount, head, onPaid, variant = "default" }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const run = async () => {
    setBusy(true)
    const res = await payStudentDue({ studentId: ME.id, head, amount })
    setDone(res)
    setBusy(false)
    onPaid()
  }

  return (
    <Dialog onOpenChange={(o) => !o && setDone(null)}>
      <DialogTrigger asChild>
        <Button size="lg" variant={variant}>
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
