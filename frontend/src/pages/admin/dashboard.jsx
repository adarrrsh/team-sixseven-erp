import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, IndianRupee, UserPlus, Users } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { LineChart, SplitBars } from "@/components/charts"
import { OrgGraph } from "@/components/org-graph"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/badge"
import { AsyncBoundary, CardsSkeleton, Skeleton } from "@/components/async-boundary"
import { useApiAll } from "@/lib/use-api"
import { getDashboard, getLeaves } from "@/lib/api"
import { inr } from "@/lib/utils"

export default function AdminDashboard() {
  const { data, error, loading, refresh } = useApiAll(
    {
      summary: () => getDashboard(),
      leaves: () => getLeaves({ status: "Pending" }),
    },
    [],
    { summary: null, leaves: [] },
  )

  const summary = data.summary
  const counts = summary?.counts
  const outstanding = summary?.fees.outstanding ?? 0
  const attendanceTrend = summary?.facultyAttendanceTrend ?? []
  const presentToday = attendanceTrend.at(-1)?.value

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything the registrar's office needs to look at first thing in the morning."
      >
        <Button asChild variant="outline" size="lg">
          <Link to="/admin/admissions">
            Review admissions
            <ArrowRight />
          </Link>
        </Button>
      </PageHeader>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={<CardsSkeleton />}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pending admissions" value={counts?.pendingAdmissions ?? 0} hint="awaiting decision" icon={UserPlus} tone="pink" />
          <StatCard label="Fees outstanding" value={inr(outstanding)} hint="across all heads" icon={IndianRupee} tone="red" />
          <StatCard label="Faculty attendance" value={presentToday != null ? `${presentToday}%` : "—"} hint={`${counts?.faculty ?? 0} on staff`} icon={Users} tone="green" />
          <StatCard label="Exams scheduled" value={counts?.scheduledExams ?? 0} hint={`${counts?.courses ?? 0} courses running`} icon={CalendarDays} tone="blue" />
        </div>
      </AsyncBoundary>

      <Section
        title="Institute graph"
        description="Departments → faculty → courses. Drag any node; the graph is the source of truth for allocation."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/faculty">Open faculty registry</Link>
          </Button>
        }
      >
        <OrgGraph />
      </Section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Faculty attendance</CardTitle>
            <CardDescription>Monthly average across all departments</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={refresh}
              skeleton={<Skeleton className="h-44 w-full" />}
            >
              <LineChart data={attendanceTrend} tone="pink" />
            </AsyncBoundary>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee collection</CardTitle>
            <CardDescription>September, by head</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={refresh}
              skeleton={<Skeleton className="h-44 w-full" />}
            >
              <SplitBars
                data={[
                  { label: "Collected", value: summary?.fees.collected ?? 0, tone: "green", display: inr(summary?.fees.collected ?? 0) },
                  { label: "Billed", value: summary?.fees.billed ?? 0, tone: "blue", display: inr(summary?.fees.billed ?? 0) },
                  { label: "Outstanding", value: outstanding, tone: "red", display: inr(outstanding) },
                ]}
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>

      <Section
        title="Pending faculty leave"
        description="Approve or reject from Faculty management"
      >
        <DataTable
          name="pending-leave"
          rows={data.leaves}
          empty={loading ? "Loading…" : "No leave awaiting a decision."}
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
          ]}
          searchPlaceholder="Search leave requests…"
        />
      </Section>
    </>
  )
}
