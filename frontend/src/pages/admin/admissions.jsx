import { useEffect, useMemo, useState } from "react"
import { Check, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { DonutChart } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/primitives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AsyncBoundary, CardsSkeleton, ErrorState, Skeleton } from "@/components/async-boundary"
import { useApiAll } from "@/lib/use-api"
import { decideAdmission, getAdmissionFees, getAdmissions } from "@/lib/api"
import { inr, pct } from "@/lib/utils"

export default function Admissions() {
  const { data, error, loading, setData, refresh } = useApiAll(
    { requests: () => getAdmissions(), fees: () => getAdmissionFees() },
    [],
    { requests: [], fees: [] },
  )
  const rows = data.requests
  const admissionFees = data.fees
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    const timer = setInterval(refresh, 5000)
    return () => clearInterval(timer)
  }, [refresh])

  const [decisionError, setDecisionError] = useState(null)

  const decide = async (id, status) => {
    setBusy(id)
    setDecisionError(null)
    try {
      const updated = await decideAdmission(id, status)
      setData((d) => ({
        ...d,
        requests: d.requests.map((r) => (r.id === id ? updated : r)),
      }))
    } catch (err) {
      setDecisionError(err)
    } finally {
      setBusy(null)
    }
  }

  const [pending, approved, rejected] = useMemo(
    () => [
      rows.filter((r) => r.status === "Pending"),
      rows.filter((r) => r.status === "Approved"),
      rows.filter((r) => r.status === "Rejected"),
    ],
    [rows],
  )

  const base = [
    { key: "id", header: "Application" },
    { key: "name", header: "Applicant" },
    { key: "program", header: "Programme" },
    { key: "score", header: "Entrance", align: "right" },
    { key: "applied", header: "Applied" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "fee", header: "Fee payable", align: "right", render: (r) => inr(r.fee) },
  ]

  const seatColumns = [
    {
      key: "feeStatus",
      header: "Seat fee",
      render: (r) => (
        <Badge tone={r.feeStatus === "Paid" ? "green" : "red"}>{r.feeStatus}</Badge>
      ),
    },
    { key: "studentId", header: "Student ID", render: (r) => r.studentId || "—" },
    { key: "paymentRef", header: "Reference", render: (r) => r.paymentRef || "—" },
  ]

  return (
    <>
      <PageHeader
        title="Admissions"
        description="Every decision here writes to the applicant's record and their fee tracker."
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={<CardsSkeleton />}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Requests" value={pending.length} hint="awaiting decision" tone="pink" />
          <StatCard label="Approved" value={approved.length} hint="seats confirmed" tone="green" />
          <StatCard label="Rejected" value={rejected.length} hint="this intake" tone="red" />
          <StatCard label="Fees collected" value={inr(admissionFees.reduce((s, f) => s + f.paid, 0))} hint="admission head" tone="blue" />
        </div>
      </AsyncBoundary>

      {decisionError ? <ErrorState error={decisionError} /> : null}

      {rows.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Decisions this intake</CardTitle>
            <CardDescription>Pending, approved and rejected, out of {rows.length} applications</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<Skeleton className="h-64 w-full" />}>
              <DonutChart
                data={[
                  { label: "Pending", value: pending.length, tone: "pink" },
                  { label: "Approved", value: approved.length, tone: "green" },
                  { label: "Rejected", value: rejected.length, tone: "red" },
                ]}
                centerValue={rows.length}
                centerLabel="total"
                size={240}
                thickness={30}
                className="justify-center"
              />
            </AsyncBoundary>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            Requests
            <Badge tone="pink">{pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="fees">Fee tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <DataTable
            name="admission-requests"
            rows={pending}
            searchPlaceholder="Search by name, programme or ID…"
            empty={loading ? "Loading…" : "No requests waiting — nice."}
            columns={[
              ...base,
              {
                key: "action",
                header: "Decision",
                export: false,
                render: (r) => (
                  <div className="flex gap-1.5">
                    <Button size="xs" disabled={busy === r.id} onClick={() => decide(r.id, "Approved")}>
                      <Check />
                      Approve
                    </Button>
                    <Button size="xs" variant="destructive" disabled={busy === r.id} onClick={() => decide(r.id, "Rejected")}>
                      <X />
                      Reject
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="approved">
          <DataTable
            name="approved-admissions"
            rows={approved}
            searchPlaceholder="Search approved admissions…"
            columns={[
              ...base,
              { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
              ...seatColumns,
            ]}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <DataTable
            name="rejected-admissions"
            rows={rejected}
            searchPlaceholder="Search rejected admissions…"
            columns={[...base, { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> }]}
          />
        </TabsContent>

        <TabsContent value="fees">
          <DataTable
            name="admission-fee-tracker"
            rows={admissionFees}
            searchPlaceholder="Search by applicant or reference…"
            columns={[
              { key: "id", header: "Application" },
              { key: "name", header: "Applicant" },
              { key: "program", header: "Programme" },
              { key: "payable", header: "Payable", align: "right", render: (r) => inr(r.payable) },
              { key: "paid", header: "Paid", align: "right", render: (r) => inr(r.paid) },
              {
                key: "progress",
                header: "Collected",
                export: false,
                render: (r) => (
                  <div className="flex w-40 items-center gap-2">
                    <Progress
                      value={pct(r.paid, r.payable)}
                      tone={r.paid >= r.payable ? "green" : r.paid === 0 ? "red" : "pink"}
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {pct(r.paid, r.payable)}%
                    </span>
                  </div>
                ),
              },
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
