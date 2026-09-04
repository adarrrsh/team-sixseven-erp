import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { BarChart, SplitBars } from "@/components/charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AsyncBoundary, CardsSkeleton, Skeleton } from "@/components/async-boundary"
import { useApiAll } from "@/lib/use-api"
import {
  getAdmissionFees,
  getCollectionTrend,
  getFinanceSummary,
  getSalaries,
  getStudentFees,
} from "@/lib/api"
import { inr } from "@/lib/utils"

export default function Finances() {
  const { data, error, loading, refresh } = useApiAll(
    {
      summary: () => getFinanceSummary(),
      trend: () => getCollectionTrend(),
      studentFees: () => getStudentFees(),
      salaries: () => getSalaries(),
      admissionFees: () => getAdmissionFees(),
    },
    [],
    { summary: null, trend: [], studentFees: [], salaries: [], admissionFees: [] },
  )

  const { studentFees, salaries, admissionFees } = data
  const feeCollectionTrend = data.trend
  const tuitionCollected = data.summary?.tuitionCollected ?? 0
  const tuitionDue = data.summary?.tuitionDue ?? 0
  const admissionCollected = data.summary?.admissionCollected ?? 0
  const payroll = data.summary?.payroll ?? 0

  return (
    <>
      <PageHeader
        title="Finances"
        description="Student fees, faculty payroll and the admission fee tracker, reconciled monthly."
      />

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tuition collected" value={inr(tuitionCollected)} hint="all heads" tone="green" />
          <StatCard
            label="Tuition outstanding"
            value={inr(tuitionDue)}
            hint={`${data.summary?.overdueAccounts ?? 0} overdue accounts`}
            tone="red"
          />
          <StatCard label="Admission fees" value={inr(admissionCollected)} hint="2026 – 27 intake" tone="blue" />
          <StatCard label="Payroll (net)" value={inr(payroll)} hint={salaries[0]?.month ?? "current cycle"} tone="pink" />
        </div>
      </AsyncBoundary>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Collection rate</CardTitle>
            <CardDescription>Percentage of the month's billing collected</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-44 w-full" />}>
              <BarChart data={feeCollectionTrend} tone="blue" />
            </AsyncBoundary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Where the money sits</CardTitle>
            <CardDescription>Current cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-44 w-full" />}>
            <SplitBars
              data={[
                { label: "Tuition collected", value: tuitionCollected, tone: "green", display: inr(tuitionCollected) },
                { label: "Admission fees", value: admissionCollected, tone: "blue", display: inr(admissionCollected) },
                { label: "Outstanding", value: tuitionDue, tone: "red", display: inr(tuitionDue) },
                { label: "Payroll committed", value: payroll, tone: "pink", display: inr(payroll) },
              ]}
            />
            </AsyncBoundary>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="student">
        <TabsList>
          <TabsTrigger value="student">Student fees</TabsTrigger>
          <TabsTrigger value="salary">Faculty salary</TabsTrigger>
          <TabsTrigger value="admission">Admission fee tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <DataTable
            name="finance-student-fees"
            empty={loading ? "Loading…" : "No fee records."}
            rows={studentFees}
            searchPlaceholder="Search students or heads…"
            columns={[
              { key: "id", header: "Student ID" },
              { key: "name", header: "Name" },
              { key: "program", header: "Programme" },
              { key: "head", header: "Head" },
              { key: "payable", header: "Payable", align: "right", render: (r) => inr(r.payable) },
              { key: "paid", header: "Paid", align: "right", render: (r) => inr(r.paid) },
              { key: "balance", header: "Balance", align: "right", render: (r) => inr(r.payable - r.paid) },
              { key: "due", header: "Due" },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="salary">
          <DataTable
            name="finance-payroll"
            empty={loading ? "Loading…" : "No payroll rows."}
            rows={salaries}
            searchPlaceholder="Search payroll…"
            columns={[
              { key: "id", header: "Staff ID" },
              { key: "name", header: "Name" },
              { key: "dept", header: "Department" },
              { key: "month", header: "Cycle" },
              { key: "gross", header: "Gross", align: "right", render: (r) => inr(r.gross) },
              { key: "deductions", header: "Deductions", align: "right", render: (r) => inr(r.deductions) },
              { key: "net", header: "Net", align: "right", render: (r) => inr(r.net) },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>

        <TabsContent value="admission">
          <DataTable
            name="finance-admission-fees"
            empty={loading ? "Loading…" : "No admission fees recorded."}
            rows={admissionFees}
            searchPlaceholder="Search applicants or references…"
            columns={[
              { key: "id", header: "Application" },
              { key: "name", header: "Applicant" },
              { key: "program", header: "Programme" },
              { key: "payable", header: "Payable", align: "right", render: (r) => inr(r.payable) },
              { key: "paid", header: "Paid", align: "right", render: (r) => inr(r.paid) },
              { key: "mode", header: "Mode" },
              { key: "ref", header: "Reference" },
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
