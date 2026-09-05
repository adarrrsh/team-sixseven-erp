import { useState } from "react"
import { Plus } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { DonutChart } from "@/components/charts"
import { TimetableGrid } from "@/components/timetable-grid"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/primitives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
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
import { AsyncBoundary, CardsSkeleton, Skeleton } from "@/components/async-boundary"
import { AttendanceRegister } from "@/components/attendance-register"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { CardRegistry } from "@/components/card-registry"
import { useApi, useApiAll } from "@/lib/use-api"
import {
  createStudent,
  getCourses,
  getDepartments,
  getExams,
  getFines,
  getScores,
  getStudentFees,
  getStudents,
  getTimetable,
  settleFine,
} from "@/lib/api"
import { inr, pct } from "@/lib/utils"

export default function StudentManagement() {
  const { data, error, loading, setData, refresh } = useApiAll(
    {
      students: () => getStudents(),
      fines: () => getFines(),
      fees: () => getStudentFees(),
      courses: () => getCourses(),
      exams: () => getExams(),
      scores: () => getScores(),
      timetable: () => getTimetable(),
    },
    [],
    { students: [], fines: [], fees: [], courses: [], exams: [], scores: [], timetable: null },
  )

  const { students, fines, courses, exams, scores } = data
  const studentFees = data.fees

  const settle = async (id) => {
    const updated = await settleFine(id)
    setData((d) => ({
      ...d,
      fines: d.fines.map((f) => (f.id === id ? updated : f)),
    }))
    refresh()
  }

  const addStudent = async (payload) => {
    const created = await createStudent(payload)
    setData((d) => ({ ...d, students: [created, ...d.students] }))
  }

  const dueTotal = students.reduce((s, r) => s + r.feesDue, 0)

  const STATUS_TONE = { Active: "green", Probation: "pink", Alumni: "blue", Inactive: "red" }
  const byStatus = [...new Set(students.map((s) => s.status))]
    .map((status) => ({
      label: status,
      value: students.filter((s) => s.status === status).length,
      tone: STATUS_TONE[status] ?? "blue",
    }))
    .filter((d) => d.value > 0)

  return (
    <>
      <PageHeader
        title="Student management"
        description="Attendance, fees, courses, exams and scores for every student on roll."
      >
        <AddStudent onAdd={addStudent} />
      </PageHeader>

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Students on roll" value={students.length} hint="active this semester" tone="pink" />
          <StatCard label="Below 75% attendance" value={students.filter((s) => s.attendance < 75).length} hint="exam-eligibility risk" tone="red" />
          <StatCard label="Fees due" value={inr(dueTotal)} hint="across all semesters" tone="blue" />
          <StatCard
            label="Average CGPA"
            value={students.length ? (students.reduce((s, r) => s + r.cgpa, 0) / students.length).toFixed(2) : "—"}
            hint="all programmes"
            tone="green"
          />
        </div>
      </AsyncBoundary>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="register">Day register</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="fines">
            Fines
            <Badge tone="red">{fines.filter((f) => f.status === "Unpaid").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="cards">RFID cards</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="flex flex-col gap-4">
          {byStatus.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Students by status</CardTitle>
                <CardDescription>Active, probation, alumni and inactive, on roll</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={byStatus}
                  centerValue={students.length}
                  centerLabel="students"
                  size={240}
                  thickness={30}
                  className="justify-center"
                />
              </CardContent>
            </Card>
          ) : null}
          <DataTable
            name="student-registry"
            empty={loading ? "Loading…" : "No students on roll yet."}
            rows={students}
            searchPlaceholder="Search students, programmes or IDs…"
            columns={[
              { key: "id", header: "Student ID" },
              { key: "name", header: "Name" },
              { key: "program", header: "Programme" },
              { key: "sem", header: "Sem", align: "right" },
              { key: "dept", header: "Department" },
              { key: "guardian", header: "Guardian" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone" },
              { key: "cgpa", header: "CGPA", align: "right" },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <Section
            title="Attendance tracker"
            description="Turnout over time and every student's standing against the 75% exam rule."
          >
            <AttendanceTracker holderType="student" />
          </Section>
        </TabsContent>

        <TabsContent value="register">
          <Section
            title="Day register"
            description="Written by the RFID readers at the gates; correct a row by hand if a card failed."
          >
            <AttendanceRegister holderType="student" />
          </Section>
        </TabsContent>

        <TabsContent value="cards">
          <Section
            title="RFID cards"
            description="Cards issued to students. Only an active card marks attendance."
          >
            <CardRegistry holderType="student" />
          </Section>
        </TabsContent>

        <TabsContent value="fees">
          <DataTable
            name="student-fees"
            empty={loading ? "Loading…" : "No fee records."}
            rows={studentFees}
            searchPlaceholder="Search fee records…"
            columns={[
              { key: "id", header: "Student ID" },
              { key: "name", header: "Name" },
              { key: "head", header: "Head" },
              { key: "payable", header: "Payable", align: "right", render: (r) => inr(r.payable) },
              { key: "paid", header: "Paid", align: "right", render: (r) => inr(r.paid) },
              {
                key: "progress",
                header: "Collected",
                export: false,
                render: (r) => (
                  <div className="flex w-40 items-center gap-2">
                    <Progress value={pct(r.paid, r.payable)} tone={r.paid >= r.payable ? "green" : r.paid === 0 ? "red" : "pink"} />
                    <span className="text-xs text-muted-foreground tabular-nums">{pct(r.paid, r.payable)}%</span>
                  </div>
                ),
              },
              { key: "due", header: "Due date" },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="fines">
          <DataTable
            name="student-fines"
            empty={loading ? "Loading…" : "No fines raised."}
            rows={fines}
            searchPlaceholder="Search fines…"
            columns={[
              { key: "id", header: "Fine" },
              { key: "student", header: "Student" },
              { key: "reason", header: "Reason" },
              { key: "amount", header: "Amount", align: "right", render: (r) => inr(r.amount) },
              { key: "raised", header: "Raised" },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
              {
                key: "action",
                header: "Collect",
                export: false,
                render: (r) =>
                  r.status === "Unpaid" ? (
                    <Button size="xs" onClick={() => settle(r.id)}>
                      Mark paid
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Settled</span>
                  ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="courses">
          <DataTable
            name="course-list"
            empty={loading ? "Loading…" : "No courses."}
            rows={courses}
            searchPlaceholder="Search courses…"
            columns={[
              { key: "code", header: "Code" },
              { key: "title", header: "Title" },
              { key: "dept", header: "Department" },
              { key: "sem", header: "Sem", align: "right" },
              { key: "credits", header: "Credits", align: "right" },
              { key: "faculty", header: "Faculty" },
              { key: "enrolled", header: "Enrolled", align: "right" },
            ]}
          />
        </TabsContent>

        <TabsContent value="timetable">
          <Section title="Class timetable" description="Generated from teacher availability">
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
              <TimetableGrid data={data.timetable?.timetable} />
            </AsyncBoundary>
          </Section>
        </TabsContent>

        <TabsContent value="exams">
          <DataTable
            name="student-exams"
            empty={loading ? "Loading…" : "No exams scheduled."}
            rows={exams}
            searchPlaceholder="Search exams…"
            columns={[
              { key: "id", header: "Exam" },
              { key: "title", header: "Title" },
              { key: "program", header: "Programme" },
              { key: "date", header: "Date" },
              { key: "slot", header: "Slot" },
              { key: "room", header: "Room" },
              { key: "students", header: "Students", align: "right" },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="score">
          <DataTable
            name="student-scores"
            empty={loading ? "Loading…" : "No marks published."}
            rows={scores}
            searchPlaceholder="Search scores…"
            columns={[
              { key: "id", header: "Student ID" },
              { key: "name", header: "Name" },
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
        </TabsContent>
      </Tabs>
    </>
  )
}

function AddStudent({ onAdd }) {
  const { data: departments } = useApi(() => getDepartments(), [], [])
  const [form, setForm] = useState({
    name: "",
    program: "B.Tech CSE",
    dept: "",
    sem: "1",
    guardian: "",
    email: "",
    phone: "",
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }))

  const dept = form.dept || departments[0] || ""

  const submit = async () => {
    setBusy(true)
    try {
      await onAdd({
        name: form.name || "New student",
        program: form.program,
        sem: Number(form.sem) || 1,
        dept,
        email: form.email || "—",
        phone: form.phone || "—",
        guardian: form.guardian || "—",
      })
      setForm({ name: "", program: "B.Tech CSE", dept: "", sem: "1", guardian: "", email: "", phone: "" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus />
          Add student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a student</DialogTitle>
          <DialogDescription>
            Enrols the student and issues a student-portal login.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="s-name">Full name</Label>
            <Input id="s-name" value={form.name} onChange={set("name")} placeholder="Ananya Bose" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-prog">Programme</Label>
            <Select value={form.program} onValueChange={(v) => setForm((f) => ({ ...f, program: v }))}>
              <SelectTrigger id="s-prog">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["B.Tech CSE", "B.Tech ECE", "B.Tech MECH", "B.Com Hons"].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-dept">Department</Label>
            <Select value={dept} onValueChange={(v) => setForm((f) => ({ ...f, dept: v }))}>
              <SelectTrigger id="s-dept">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-sem">Semester</Label>
            <Input id="s-sem" type="number" min="1" max="8" value={form.sem} onChange={set("sem")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-guardian">Guardian</Label>
            <Input id="s-guardian" value={form.guardian} onChange={set("guardian")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-email">Email</Label>
            <Input id="s-email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s-phone">Phone</Label>
            <Input id="s-phone" value={form.phone} onChange={set("phone")} />
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
              {busy ? "Enrolling…" : "Enrol student"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
