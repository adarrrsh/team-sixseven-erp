import { useMemo, useState } from "react"
import { Check, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/primitives"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { admissionFees, admissionRequests } from "@/lib/data"
import { inr, pct } from "@/lib/utils"

export default function Admissions() {
  const [rows, setRows] = useState(admissionRequests)

  const decide = (id, status) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))

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

  return (
    <>
      <PageHeader
        title="Admissions"
        description="Every decision here writes to the applicant's record and their fee tracker."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests" value={pending.length} hint="awaiting decision" tone="pink" />
        <StatCard label="Approved" value={approved.length} hint="seats confirmed" tone="green" />
        <StatCard label="Rejected" value={rejected.length} hint="this intake" tone="red" />
        <StatCard label="Fees collected" value={inr(admissionFees.reduce((s, f) => s + f.paid, 0))} hint="admission head" tone="blue" />
      </div>

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
            empty="No requests waiting — nice."
            columns={[
              ...base,
              {
                key: "action",
                header: "Decision",
                export: false,
                render: (r) => (
                  <div className="flex gap-1.5">
                    <Button size="xs" onClick={() => decide(r.id, "Approved")}>
                      <Check />
                      Approve
                    </Button>
                    <Button size="xs" variant="destructive" onClick={() => decide(r.id, "Rejected")}>
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
            columns={[...base, { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> }]}
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
