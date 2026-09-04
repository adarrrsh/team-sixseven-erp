import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
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
import { exams as examSeed, faculty } from "@/lib/data"

export default function Examinations() {
  const [exams, setExams] = useState(examSeed)

  const remove = (id) => setExams((xs) => xs.filter((x) => x.id !== id))
  const upcoming = exams.filter((e) => e.status !== "Completed")
  const history = exams.filter((e) => e.status === "Completed")

  const columns = [
    { key: "id", header: "Exam" },
    { key: "title", header: "Title" },
    { key: "program", header: "Programme" },
    { key: "date", header: "Date" },
    { key: "slot", header: "Slot" },
    { key: "room", header: "Room" },
    { key: "invigilator", header: "Invigilator" },
    { key: "students", header: "Students", align: "right" },
    { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
  ]

  return (
    <>
      <PageHeader
        title="Examinations"
        description="Create and retire exams, assign invigilators, keep the history auditable."
      >
        <CreateExam onCreate={(e) => setExams((xs) => [e, ...xs])} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scheduled" value={exams.filter((e) => e.status === "Scheduled").length} hint="next 30 days" tone="blue" />
        <StatCard label="Drafts" value={exams.filter((e) => e.status === "Draft").length} hint="not published" tone="pink" />
        <StatCard label="Completed" value={history.length} hint="this academic year" tone="green" />
        <StatCard label="Unassigned duty" value={exams.filter((e) => e.invigilator === "Unassigned").length} hint="needs an invigilator" tone="red" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <DataTable
            name="exams-upcoming"
            rows={upcoming}
            searchPlaceholder="Search exams…"
            columns={[
              ...columns,
              {
                key: "delete",
                header: "",
                export: false,
                render: (r) => (
                  <Button size="icon-xs" variant="destructive" aria-label={`Delete ${r.id}`} onClick={() => remove(r.id)}>
                    <Trash2 />
                  </Button>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="history">
          <DataTable
            name="exams-history"
            rows={history}
            searchPlaceholder="Search past exams…"
            columns={columns}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}

function CreateExam({ onCreate }) {
  const [form, setForm] = useState({
    title: "",
    program: "B.Tech CSE",
    date: "",
    slot: "09:30 – 12:30",
    room: "",
    invigilator: "Unassigned",
    students: "60",
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }))

  const submit = () =>
    onCreate({
      id: "EX-" + Math.floor(710 + Math.random() * 80),
      title: form.title || "Untitled exam",
      program: form.program,
      date: form.date || "2026-10-01",
      slot: form.slot,
      room: form.room || "TBD",
      invigilator: form.invigilator,
      students: Number(form.students) || 0,
      status: "Draft",
    })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus />
          Create exam
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an exam</DialogTitle>
          <DialogDescription>
            Saved as a draft — publishing notifies students and faculty.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="e-title">Title</Label>
            <Input id="e-title" value={form.title} onChange={set("title")} placeholder="Semester End · Sem 5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-prog">Programme</Label>
            <Select value={form.program} onValueChange={(v) => setForm((f) => ({ ...f, program: v }))}>
              <SelectTrigger id="e-prog">
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
            <Label htmlFor="e-date">Date</Label>
            <Input id="e-date" type="date" value={form.date} onChange={set("date")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-room">Room</Label>
            <Input id="e-room" value={form.room} onChange={set("room")} placeholder="Block A · 204" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-inv">Invigilator</Label>
            <Select value={form.invigilator} onValueChange={(v) => setForm((f) => ({ ...f, invigilator: v }))}>
              <SelectTrigger id="e-inv">
                <SelectValue />
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-count">Students</Label>
            <Input id="e-count" type="number" value={form.students} onChange={set("students")} />
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
              Save draft
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
