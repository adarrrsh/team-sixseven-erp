import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { BarChart } from "@/components/charts"
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
import {
  DEPARTMENTS,
  exams,
  faculty as facultySeed,
  facultyAttendanceTrend,
  leaveRequests as leaveSeed,
  salaries,
  timetable,
} from "@/lib/data"
import { inr } from "@/lib/utils"

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState(facultySeed)
  const [leave, setLeave] = useState(leaveSeed)
  const [duties, setDuties] = useState(exams)

  const decide = (id, status) =>
    setLeave((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))

  const assign = (examId, name) =>
    setDuties((ds) => ds.map((d) => (d.id === examId ? { ...d, invigilator: name } : d)))

  return (
    <>
      <PageHeader
        title="Faculty management"
        description="Directory, leave, attendance, salary and invigilation duty in one place."
      >
        <AddTeacher onAdd={(t) => setFaculty((f) => [t, ...f])} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teachers on roll" value={faculty.length} hint="4 departments" tone="pink" />
        <StatCard label="Pending leave" value={leave.filter((l) => l.status === "Pending").length} hint="needs a decision" tone="red" />
        <StatCard label="Average attendance" value="89%" delta="+2%" hint="rolling 30 days" tone="green" />
        <StatCard label="Monthly payroll" value={inr(salaries.reduce((s, r) => s + r.net, 0))} hint="net, Aug 2026" tone="blue" />
      </div>

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

        <TabsContent value="directory">
          <DataTable
            name="teacher-registry"
            rows={faculty}
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
              <BarChart data={facultyAttendanceTrend} tone="pink" />
            </CardContent>
          </Card>
          <DataTable
            name="faculty-attendance"
            rows={faculty}
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
            <TimetableGrid data={timetable} show="faculty" />
          </Section>
        </TabsContent>

        <TabsContent value="duty">
          <DataTable
            name="invigilator-duty"
            rows={duties}
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
  const [form, setForm] = useState({ name: "", dept: DEPARTMENTS[0], subject: "", email: "", phone: "", salary: "120000" })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }))

  const submit = () => {
    onAdd({
      id: "FC-" + Math.floor(160 + Math.random() * 40),
      name: form.name || "New teacher",
      dept: form.dept,
      subject: form.subject || "—",
      email: form.email || "—",
      phone: form.phone || "—",
      exp: 0,
      salary: Number(form.salary) || 0,
      attendance: 100,
      load: 0,
      status: "Active",
    })
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
            <Select value={form.dept} onValueChange={(v) => setForm((f) => ({ ...f, dept: v }))}>
              <SelectTrigger id="t-dept">
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
            <Button size="lg" onClick={submit}>
              Create record
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
