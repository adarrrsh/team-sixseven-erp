import { useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { TimetableGrid } from "@/components/timetable-grid"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DAYS, PERIODS, faculty, teacherAvailability, timetable } from "@/lib/data"
import { cn } from "cn"

/** Reassign the slots of unavailable teachers to a colleague free in that slot. */
function rebuild(base, unavailable) {
  const out = {}
  DAYS.forEach((day) => {
    out[day] = base[day].map((slot, pi) => {
      if (!slot || !unavailable.includes(slot.faculty)) return slot
      const tag = `${day} P${pi + 1}`
      const sub = teacherAvailability.find(
        (t) => t.free.includes(tag) && !unavailable.includes(t.name),
      )
      return sub
        ? { ...slot, faculty: sub.name, room: slot.room, substitute: true }
        : { ...slot, faculty: "Unstaffed", substitute: true }
    })
  })
  return out
}

export default function AdminTimetable() {
  const [unavailable, setUnavailable] = useState(["Dr. Sneha Kulkarni"])
  const [version, setVersion] = useState(1)

  const grid = useMemo(() => rebuild(timetable, unavailable), [unavailable])

  const changes = useMemo(
    () =>
      DAYS.flatMap((d) =>
        grid[d]
          .map((slot, pi) =>
            slot?.substitute
              ? {
                  id: `${d}-${pi}`,
                  day: d,
                  period: PERIODS[pi],
                  code: slot.code,
                  room: slot.room,
                  cover: slot.faculty,
                  status: slot.faculty === "Unstaffed" ? "Needs cover" : "Reassigned",
                }
              : null,
          )
          .filter(Boolean),
      ),
    [grid],
  )

  const toggle = (name) =>
    setUnavailable((u) => (u.includes(name) ? u.filter((n) => n !== name) : [...u, name]))

  return (
    <>
      <PageHeader
        title="Time-table"
        description="Student and teacher timetables regenerate from teacher availability — mark someone unavailable and the grid re-staffs itself."
      >
        <Button variant="outline" size="lg" onClick={() => setVersion((v) => v + 1)}>
          <RefreshCw />
          Rebuild · v{version}
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
            const off = unavailable.includes(f.name)
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
                  {off ? "Unavailable" : `${f.dept} · free ${teacherAvailability.find((t) => t.name === f.name)?.free.length ?? 0} slots`}
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
            <TimetableGrid data={grid} />
          </Section>
        </TabsContent>

        <TabsContent value="teacher">
          <Section title="Staffing" description="Who stands in front of the class">
            <TimetableGrid data={grid} show="faculty" />
          </Section>
        </TabsContent>

        <TabsContent value="changes">
          <DataTable
            name="timetable-changes"
            rows={changes}
            searchPlaceholder="Search reassignments…"
            empty="No reassignments — everyone is available."
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
