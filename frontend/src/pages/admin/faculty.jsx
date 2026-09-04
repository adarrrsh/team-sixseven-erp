import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { DonutChart, LineChart } from "@/components/charts"
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
import { useApi, useApiAll } from "@/lib/use-api"
import {
  assignInvigilator,
  createFaculty,
  decideLeave,
  getDepartments,
  getFaculty,
  getFacultyAttendance,
  getInvigilatorDuties,
  getLeaves,
  getSalaries,
  getTimetable,
} from "@/lib/api"
import { inr } from "@/lib/utils"

export default function FacultyManagement() {
  const { data, error, loading, setData, refresh } = useApiAll(
    {
      faculty: () => getFaculty(),
      leave: () => getLeaves(),
      duties: () => getInvigilatorDuties(),
      salaries: () => getSalaries(),
      attendance: () => getFacultyAttendance(),
      timetable: () => getTimetable(),
    },
    [],
    { faculty: [], leave: [], duties: [], salaries: [], attendance: null, timetable: null },
  )

  const { faculty, leave, duties, salaries } = data
  const attendanceTrend = data.attendance?.trend ?? []
  const avgAttendance = faculty.length
    ? Math.round(faculty.reduce((s, f) => s + f.attendance, 0) / faculty.length)
    : 0

  const DEPT_TONE = ["pink", "blue", "green", "red"]
  const byDept = [...new Set(faculty.map((f) => f.dept))]
    .sort()
    .map((dept, i) => ({
      label: dept,
      value: faculty.filter((f) => f.dept === dept).length,
      tone: DEPT_TONE[i % DEPT_TONE.length],
    }))

  /**
   * Approving leave also flips the teacher's status server-side, which the
   * timetable re-staffs around — so pull both back down after a decision.
   */
  const decide = async (id, status) => {
    const updated = await decideLeave(id, status)
    setData((d) => ({
      ...d,
      leave: d.leave.map((l) => (l.id === id ? updated : l)),
    }))
    refresh()
  }

  const assign = async (examId, name) => {
    const updated = await assignInvigilator(examId, name)
    setData((d) => ({
      ...d,
      duties: d.duties.map((x) => (x.id === examId ? updated : x)),
    }))
  }

  const addTeacher = async (payload) => {
    const created = await createFaculty(payload)
    setData((d) => ({ ...d, faculty: [created, ...d.faculty] }))
  }

  return (
    <>
      <PageHeader
        title="Faculty management"
        description="Directory, leave, attendance, salary and invigilation duty in one place."
      >
        <AddTeacher onAdd={addTeacher} />
      </PageHeader>

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Teachers on roll" value={faculty.length} hint={`${new Set(faculty.map((f) => f.dept)).size} departments`} tone="pink" />
          <StatCard label="Pending leave" value={leave.filter((l) => l.status === "Pending").length} hint="needs a decision" tone="red" />
          <StatCard label="Average attendance" value={`${avgAttendance}%`} hint="rolling 30 days" tone="green" />
          <StatCard label="Monthly payroll" value={inr(salaries.reduce((s, r) => s + r.net, 0))} hint={`net, ${salaries[0]?.month ?? "current cycle"}`} tone="blue" />
        </div>
      </AsyncBoundary>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="leave">
            Leave requests
            <Badge tone="pink">{leave.filter((l) => l.status === "Pending").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="duty">Invigilator duty</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="flex flex-col gap-4">
          {byDept.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Faculty by department</CardTitle>
                <CardDescription>Headcount across the institute</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutChart data={byDept} centerValue={faculty.length} centerLabel="teachers" />
              </CardContent>
            </Card>
          ) : null}
          <DataTable
            name="teacher-registry"
            rows={faculty}
            empty={loading ? "Loading…" : "No teachers on roll yet."}
            searchPlaceholder="Search teachers, departments or subjects…"
            columns={[
              { key: "id", header: "Staff ID" },
              { key: "name", header: "Name" },
              { key: "dept", header: "Department" },
              { key: "subject", header: "Subject" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone" },
              { key: "exp", header: "Yrs", align: "right" },
              { key: "load", header: "Load (h/wk)", align: "right" },
              { key: "salary", header: "Gross", align: "right", render: (r) => inr(r.salary) },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="leave">
          <DataTable
            name="leave-requests"
            rows={leave}
            empty={loading ? "Loading…" : "No leave requests."}
            searchPlaceholder="Search leave requests…"
            columns={[
              { key: "id", header: "Request" },
              { key: "name", header: "Faculty" },
              { key: "dept", header: "Department" },
              { key: "type", header: "Type" },
              { key: "from", header: "From" },
              { key: "to", header: "To" },
              { key: "days", header: "Days", align: "right" },
              { key: "cover", header: "Cover" },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
              {
                key: "action",
                header: "Decision",
                export: false,
                render: (r) =>
                  r.status === "Pending" ? (
                    <div className="flex gap-1.5">
                      <Button size="xs" onClick={() => decide(r.id, "Approved")}>
                        <Check />
                        Approve
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => decide(r.id, "Rejected")}>
                        <X />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="attendance" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance trend</CardTitle>
              <CardDescription>Institute-wide monthly average</CardDescription>
            </CardHeader>
            <CardContent>
              <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-44 w-full" />}>
                <LineChart data={attendanceTrend} tone="pink" />
              </AsyncBoundary>
            </CardContent>
          </Card>
          <DataTable
            name="faculty-attendance"
            rows={faculty}
            empty={loading ? "Loading…" : "No attendance recorded."}
            searchPlaceholder="Search by teacher…"
            columns={[
              { key: "id", header: "Staff ID" },
              { key: "name", header: "Name" },
              { key: "dept", header: "Department" },
              { key: "attendance", header: "Present %", align: "right" },
              {
                key: "bar",
                header: "Rolling 30 days",
                export: false,
                render: (r) => (
                  <div className="w-48">
                    <Progress value={r.attendance} tone={r.attendance >= 90 ? "green" : r.attendance >= 80 ? "pink" : "red"} />
                  </div>
                ),
              },
              { key: "load", header: "Load (h/wk)", align: "right" },
            ]}
          />
        </TabsContent>

        <TabsContent value="salary">
          <DataTable
            name="faculty-salary"
            rows={salaries}
            empty={loading ? "Loading…" : "No payroll rows for this cycle."}
            searchPlaceholder="Search payroll…"
            columns={[
              { key: "id", header: "Staff ID" },
              { key: "name", header: "Name" },
              { key: "dept", header: "Department" },
              { key: "month", header: "Cycle" },
              { key: "gross", header: "Gross", align: "right", render: (r) => inr(r.gross) },
              { key: "deductions", header: "Deductions", align: "right", render: (r) => inr(r.deductions) },
              { key: "net", header: "Net pay", align: "right", render: (r) => inr(r.net) },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="timetable">
          <Section
            title="Teaching timetable"
            description="Slot colour follows the department; free slots are open for allocation."
          >
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
              <TimetableGrid data={data.timetable?.timetable} show="faculty" />
            </AsyncBoundary>
          </Section>
        </TabsContent>

        <TabsContent value="duty">
          <DataTable
            name="invigilator-duty"
            rows={duties}
            empty={loading ? "Loading…" : "No exams to staff."}
            searchPlaceholder="Search exams…"
            columns={[
              { key: "id", header: "Exam" },
              { key: "title", header: "Title" },
              { key: "date", header: "Date" },
              { key: "slot", header: "Slot" },
              { key: "room", header: "Room" },
              { key: "invigilator", header: "Invigilator" },
              {
                key: "assign",
                header: "Assign",
                export: false,
                render: (r) => (
                  <Select value={r.invigilator} onValueChange={(v) => assign(r.id, v)}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Pick a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                      {faculty.map((f) => (
                        <SelectItem key={f.id} value={f.name}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}

function AddTeacher({ onAdd }) {
  const { data: departments } = useApi(() => getDepartments(), [], [])
  const [form, setForm] = useState({ name: "", dept: "", subject: "", email: "", phone: "", salary: "120000" })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }))

  const dept = form.dept || departments[0] || ""

  // The staff ID is issued by the backend, which knows the highest one in use.
  const submit = async () => {
    setBusy(true)
    try {
      await onAdd({
        name: form.name || "New teacher",
        dept,
        subject: form.subject || "—",
        email: form.email || "—",
        phone: form.phone || "—",
        salary: Number(form.salary) || 0,
      })
      setForm({ name: "", dept: "", subject: "", email: "", phone: "", salary: "120000" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus />
          Add teacher
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a teacher</DialogTitle>
          <DialogDescription>
            Creates a staff record and a login for the faculty portal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="t-name">Full name</Label>
            <Input id="t-name" value={form.name} onChange={set("name")} placeholder="Dr. Anita Rao" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-dept">Department</Label>
            <Select value={dept} onValueChange={(v) => setForm((f) => ({ ...f, dept: v }))}>
              <SelectTrigger id="t-dept">
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
            <Label htmlFor="t-subject">Subject</Label>
            <Input id="t-subject" value={form.subject} onChange={set("subject")} placeholder="Operating Systems" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-email">Email</Label>
            <Input id="t-email" type="email" value={form.email} onChange={set("email")} placeholder="anita.rao@origin.edu" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-phone">Phone</Label>
            <Input id="t-phone" value={form.phone} onChange={set("phone")} placeholder="98110 00000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-salary">Gross salary</Label>
            <Input id="t-salary" type="number" value={form.salary} onChange={set("salary")} />
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
              {busy ? "Creating…" : "Create record"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
