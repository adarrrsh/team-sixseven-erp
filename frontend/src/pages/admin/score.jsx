import { useState } from "react"
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
import { AsyncBoundary, CardsSkeleton, ErrorState, Skeleton } from "@/components/async-boundary"
import { useApiAll } from "@/lib/use-api"
import { getScores, getScoresByCourse, getScoreStats, updateMarks } from "@/lib/api"

export default function ScorePage() {
  const { data, error, loading, setData, refresh } = useApiAll(
    {
      rows: () => getScores(),
      stats: () => getScoreStats(),
      byCourse: () => getScoresByCourse(),
    },
    [],
    { rows: [], stats: null, byCourse: [] },
  )
  const rows = data.rows
  const stats = data.stats ?? { records: 0, average: 0, distinctions: 0, belowPass: 0 }

  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const save = async () => {
    setBusy(true)
    setSaveError(null)
    try {
      const updated = await updateMarks(editing, Number(draft) || 0)
      setData((d) => ({
        ...d,
        rows: d.rows.map((r) => (r.id === updated.id && r.course === updated.course ? updated : r)),
      }))
      setEditing(null)
      refresh()
    } catch (err) {
      setSaveError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Score"
        description="Marks per student and exam. Editing here updates the student's portal immediately."
      />

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Records" value={stats.records} hint="published marks" tone="pink" />
          <StatCard label="Institute average" value={`${stats.average}%`} hint="across every exam" tone="green" />
          <StatCard label="Distinctions" value={stats.distinctions} hint="85% and above" tone="blue" />
          <StatCard label="Below pass" value={stats.belowPass} hint="needs re-exam" tone="red" />
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
              <BarChart data={data.byCourse} tone="blue" />
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
              <RadialGauge value={stats.average} tone={stats.average >= 60 ? "green" : "red"} label="average score" />
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

      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setSaveError(null)
          }
        }}
      >
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

          {saveError ? <ErrorState error={saveError} /> : null}

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
