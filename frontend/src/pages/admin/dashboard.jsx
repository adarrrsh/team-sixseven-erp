import { Link } from "react-router-dom"
import { ArrowRight, CalendarDays, IndianRupee, UserPlus, Users } from "lucide-react"
import { PageHeader, Section } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { BarChart, SplitBars } from "@/components/charts"
import { OrgGraph } from "@/components/org-graph"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/badge"
import {
  admissionRequests,
  facultyAttendanceTrend,
  leaveRequests,
  studentFees,
} from "@/lib/data"
import { inr } from "@/lib/utils"

export default function AdminDashboard() {
  const pending = admissionRequests.filter((a) => a.status === "Pending")
  const outstanding = studentFees.reduce((s, f) => s + (f.payable - f.paid), 0)

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending admissions" value={pending.length} hint="awaiting decision" icon={UserPlus} tone="pink" />
        <StatCard label="Fees outstanding" value={inr(outstanding)} delta="-8%" hint="vs last month" icon={IndianRupee} tone="red" />
        <StatCard label="Faculty present today" value="91%" delta="+4%" hint="6 of 6 departments" icon={Users} tone="green" />
        <StatCard label="Exams this month" value="2" hint="14 & 15 September" icon={CalendarDays} tone="blue" />
      </div>

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
            <BarChart data={facultyAttendanceTrend} tone="pink" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee collection</CardTitle>
            <CardDescription>September, by head</CardDescription>
          </CardHeader>
          <CardContent>
            <SplitBars
              data={[
                { label: "Tuition collected", value: 85000, tone: "green", display: inr(85000) },
                { label: "Admission fees", value: 35000, tone: "blue", display: inr(35000) },
                { label: "Outstanding", value: outstanding, tone: "red", display: inr(outstanding) },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Section
        title="Pending faculty leave"
        description="Approve or reject from Faculty management"
      >
        <DataTable
          name="pending-leave"
          rows={leaveRequests}
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
