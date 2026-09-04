import { useState } from "react"
import { Plus } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { TimetableGrid } from "@/components/timetable-grid"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/primitives"
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
import {
  courses,
  DEPARTMENTS,
  exams,
  fines as finesSeed,
  scores,
  studentFees,
  students as studentSeed,
  timetable,
} from "@/lib/data"
import { inr, pct } from "@/lib/utils"

export default function StudentManagement() {
  const [students, setStudents] = useState(studentSeed)
  const [fines, setFines] = useState(finesSeed)

  const settle = (id) =>
    setFines((fs) => fs.map((f) => (f.id === id ? { ...f, status: "Paid" } : f)))

  const dueTotal = students.reduce((s, r) => s + r.feesDue, 0)

  return (
    <>
      <PageHeader
        title="Student management"
        description="Attendance, fees, courses, exams and scores for every student on roll."
      >
        <AddStudent onAdd={(s) => setStudents((xs) => [s, ...xs])} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students on roll" value={students.length} hint="active this semester" tone="pink" />
        <StatCard label="Below 75% attendance" value={students.filter((s) => s.attendance < 75).length} hint="exam-eligibility risk" tone="red" />
        <StatCard label="Fees due" value={inr(dueTotal)} hint="across all semesters" tone="blue" />
        <StatCard label="Average CGPA" value={(students.reduce((s, r) => s + r.cgpa, 0) / students.length).toFixed(2)} hint="all programmes" tone="green" />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="fines">
            Fines
            <Badge tone="red">{fines.filter((f) => f.status === "Unpaid").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <DataTable
            name="student-registry"
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
          <DataTable
            name="student-attendance"
            rows={students}
            searchPlaceholder="Search by student…"
            columns={[
              { key: "id", header: "Student ID" },
              { key: "name", header: "Name" },
              { key: "program", header: "Programme" },
              { key: "attendance", header: "Present %", align: "right" },
              {
                key: "bar",
                header: "This semester",
                export: false,
                render: (r) => (
                  <div className="w-48">
                    <Progress value={r.attendance} tone={r.attendance >= 85 ? "green" : r.attendance >= 75 ? "pink" : "red"} />
                  </div>
                ),
              },
              {
                key: "eligible",
                header: "Exam eligible",
                render: (r) => <StatusBadge value={r.attendance >= 75 ? "Approved" : "Rejected"} />,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="fees">
          <DataTable
            name="student-fees"
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
            <TimetableGrid data={timetable} />
          </Section>
        </TabsContent>

        <TabsContent value="exams">
          <DataTable
            name="student-exams"
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
  const [form, setForm] = useState({
    name: "",
    program: "B.Tech CSE",
    dept: DEPARTMENTS[0],
    sem: "1",
    guardian: "",
    email: "",
    phone: "",
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }))

  const submit = () =>
    onAdd({
      id: "ST-" + Math.floor(8810 + Math.random() * 80),
      name: form.name || "New student",
      program: form.program,
      sem: Number(form.sem) || 1,
      dept: form.dept,
      attendance: 100,
      cgpa: 0,
      feesDue: 0,
      fines: 0,
      email: form.email || "—",
      phone: form.phone || "—",
      guardian: form.guardian || "—",
      status: "Active",
    })

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
            <Select value={form.dept} onValueChange={(v) => setForm((f) => ({ ...f, dept: v }))}>
              <SelectTrigger id="s-dept">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
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
            <Button size="lg" onClick={submit}>
              Enrol student
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
