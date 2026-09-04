import { useMemo, useState } from "react"
import { PenLine } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { BarChart, RadialGauge } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@/components/ui/dialog"
import { AsyncBoundary, CardsSkeleton, Skeleton } from "@/components/async-boundary"
import { useApi } from "@/lib/use-api"
import { getScores, updateMarks } from "@/lib/api"

export default function ScorePage() {
  const { data: rows, error, loading, setData: setRows, refresh } = useApi(
    () => getScores(),
    [],
    [],
  )
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)

  /** The backend clamps to 0–100 and derives the grade, so trust what it returns. */
  const save = async () => {
    setBusy(true)
    try {
      const updated = await updateMarks(editing, Number(draft) || 0)
      setRows((rs) =>
        rs.map((r) =>
          r.id === updated.id && r.course === updated.course ? updated : r,
        ),
      )
      setEditing(null)
    } finally {
      setBusy(false)
    }
  }

  const byCourse = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      const list = map.get(r.course) ?? []
      list.push(r.marks)
      map.set(r.course, list)
    })
    return [...map.entries()].map(([label, marks]) => ({
      label,
      value: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
    }))
  }, [rows])

  const avg = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.marks, 0) / rows.length)
    : 0

  return (
    <>
      <PageHeader
        title="Score"
        description="Marks per student and exam. Editing here updates the student's portal immediately."
      />

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Records" value={rows.length} hint="published marks" tone="pink" />
          <StatCard label="Institute average" value={`${avg}%`} hint="across every exam" tone="green" />
          <StatCard label="Distinctions" value={rows.filter((r) => r.marks >= 85).length} hint="85% and above" tone="blue" />
          <StatCard label="Below pass" value={rows.filter((r) => r.marks < 50).length} hint="needs re-exam" tone="red" />
        </div>
      </AsyncBoundary>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Average by course</CardTitle>
            <CardDescription>Across every published exam</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-44 w-full" />}>
              <BarChart data={byCourse} tone="blue" />
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Institute average</CardTitle>
            <CardDescription>All published marks</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-44 w-full" />}>
              <RadialGauge value={avg} tone={avg >= 60 ? "green" : "red"} label="average score" />
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>

      <DataTable
        name="scores"
        rows={rows}
        empty={loading ? "Loading…" : "No marks published yet."}
        searchPlaceholder="Search students, exams or courses…"
        columns={[
          { key: "id", header: "Student ID" },
          { key: "name", header: "Name" },
          { key: "program", header: "Programme" },
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
          {
            key: "edit",
            header: "Update",
            export: false,
            render: (r) => (
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setEditing(r)
                  setDraft(String(r.marks))
                }}
              >
                <PenLine />
                Edit marks
              </Button>
            ),
          },
        ]}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update marks</DialogTitle>
            <DialogDescription>
              {editing ? `${editing.name} · ${editing.course} · ${editing.exam}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="marks">Marks out of 100</Label>
            <Input id="marks" type="number" min="0" max="100" value={draft} onChange={(e) => setDraft(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="lg">
                Cancel
              </Button>
            </DialogClose>
            <Button size="lg" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save marks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
