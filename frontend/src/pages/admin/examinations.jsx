import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { DonutChart } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
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
import { AsyncBoundary, CardsSkeleton } from "@/components/async-boundary"
import { useApiAll } from "@/lib/use-api"
import { createExam, deleteExam, getExams, getFaculty } from "@/lib/api"

export default function Examinations() {
  const { data, error, loading, setData, refresh } = useApiAll(
    { exams: () => getExams(), faculty: () => getFaculty() },
    [],
    { exams: [], faculty: [] },
  )
  const exams = data.exams

  const remove = async (id) => {
    await deleteExam(id)
    setData((d) => ({ ...d, exams: d.exams.filter((x) => x.id !== id) }))
  }

  const create = async (payload) => {
    const created = await createExam(payload)
    setData((d) => ({ ...d, exams: [created, ...d.exams] }))
  }
  const upcoming = exams.filter((e) => e.status !== "Completed")
  const history = exams.filter((e) => e.status === "Completed")

  const STATUS_TONE = { Draft: "pink", Scheduled: "blue", Completed: "green", Cancelled: "red" }
  const byStatus = [...new Set(exams.map((e) => e.status))]
    .map((status) => ({
      label: status,
      value: exams.filter((e) => e.status === status).length,
      tone: STATUS_TONE[status] ?? "blue",
    }))
    .filter((d) => d.value > 0)

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
        <CreateExam onCreate={create} faculty={data.faculty} />
      </PageHeader>

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Scheduled" value={exams.filter((e) => e.status === "Scheduled").length} hint="next 30 days" tone="blue" />
          <StatCard label="Drafts" value={exams.filter((e) => e.status === "Draft").length} hint="not published" tone="pink" />
          <StatCard label="Completed" value={history.length} hint="this academic year" tone="green" />
          <StatCard label="Unassigned duty" value={exams.filter((e) => e.invigilator === "Unassigned").length} hint="needs an invigilator" tone="red" />
        </div>
      </AsyncBoundary>

      {byStatus.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Exams by status</CardTitle>
            <CardDescription>Draft, scheduled, completed and cancelled</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={byStatus}
              centerValue={exams.length}
              centerLabel="exams"
              size={240}
              thickness={30}
              className="justify-center"
            />
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <DataTable
            name="exams-upcoming"
            rows={upcoming}
            empty={loading ? "Loading…" : "No exams scheduled."}
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
            empty={loading ? "Loading…" : "No completed exams yet."}
            searchPlaceholder="Search past exams…"
            columns={columns}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}

function CreateExam({ onCreate, faculty }) {
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

  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await onCreate({
        title: form.title || "Untitled exam",
        program: form.program,
        date: form.date || "2026-10-01",
        slot: form.slot,
        room: form.room || "TBD",
        invigilator: form.invigilator,
        students: Number(form.students) || 0,
      })
    } finally {
      setBusy(false)
    }
  }

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
            <Button size="lg" disabled={busy} onClick={submit}>
              {busy ? "Saving…" : "Save draft"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
