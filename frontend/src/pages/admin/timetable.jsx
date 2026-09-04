import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { TimetableGrid } from "@/components/timetable-grid"
import { DataTable } from "@/components/data-table"
import { AsyncBoundary, Skeleton } from "@/components/async-boundary"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApiAll } from "@/lib/use-api"
import { getFaculty, getTimetable, rebuildTimetable } from "@/lib/api"
import { cn } from "cn"

export default function AdminTimetable() {
  const [unavailable, setUnavailable] = useState([])
  const [rebuilding, setRebuilding] = useState(false)

  /**
   * The backend re-staffs the grid: it folds anyone on approved leave into the
   * unavailable list, finds a colleague free in that slot, and returns both the
   * resulting grid and the list of changes.
   */
  const { data, error, loading, setData, refresh } = useApiAll(
    {
      grid: () => getTimetable({ unavailable: unavailable.join(",") }),
      faculty: () => getFaculty(),
    },
    [unavailable.join(",")],
    { grid: null, faculty: [] },
  )

  const faculty = data.faculty
  const grid = data.grid?.timetable
  const changes = data.grid?.changes ?? []
  const version = data.grid?.version ?? 1
  // Includes teachers the server marked unavailable because their leave was approved.
  const effectiveUnavailable = data.grid?.unavailable ?? unavailable

  const toggle = (name) =>
    setUnavailable((u) => (u.includes(name) ? u.filter((n) => n !== name) : [...u, name]))

  const rebuild = async () => {
    setRebuilding(true)
    try {
      const next = await rebuildTimetable(unavailable)
      setData((d) => ({ ...d, grid: next }))
    } finally {
      setRebuilding(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Time-table"
        description="Student and teacher timetables regenerate from teacher availability — mark someone unavailable and the grid re-staffs itself."
      >
        <Button variant="outline" size="lg" disabled={rebuilding || loading} onClick={rebuild}>
          <RefreshCw />
          {rebuilding ? "Rebuilding…" : `Rebuild · v${version}`}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Teacher availability</CardTitle>
          <CardDescription>
            Click a teacher to mark them unavailable this week.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {faculty.map((f) => {
            const off = effectiveUnavailable.includes(f.name)
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f.name)}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-2xl border px-3 py-2 text-left transition-colors",
                  off
                    ? "border-red-strong bg-red-strong text-white"
                    : "border-border hover:bg-secondary",
                )}
              >
                <span className="text-sm font-medium">{f.name}</span>
                <span className="text-xs opacity-75">
                  {off
                    ? f.status === "On leave"
                      ? "On approved leave"
                      : "Unavailable"
                    : `${f.dept} · free ${f.free?.length ?? 0} slots`}
                </span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Tabs defaultValue="student">
        <TabsList>
          <TabsTrigger value="student">Student view</TabsTrigger>
          <TabsTrigger value="teacher">Teacher view</TabsTrigger>
          <TabsTrigger value="changes">
            Changes
            <Badge tone={changes.some((c) => c.status === "Needs cover") ? "red" : "green"}>
              {changes.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <Section title="Rooms and courses" description="What students see in their portal">
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
              <TimetableGrid data={grid} />
            </AsyncBoundary>
          </Section>
        </TabsContent>

        <TabsContent value="teacher">
          <Section title="Staffing" description="Who stands in front of the class">
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-72 w-full" />}>
              <TimetableGrid data={grid} show="faculty" />
            </AsyncBoundary>
          </Section>
        </TabsContent>

        <TabsContent value="changes">
          <DataTable
            name="timetable-changes"
            rows={changes}
            searchPlaceholder="Search reassignments…"
            empty={loading ? "Loading…" : "No reassignments — everyone is available."}
            columns={[
              { key: "day", header: "Day" },
              { key: "period", header: "Period" },
              { key: "code", header: "Course" },
              { key: "room", header: "Room" },
              { key: "cover", header: "Now taken by" },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <Badge tone={r.status === "Needs cover" ? "red" : "green"}>{r.status}</Badge>
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
