import { useEffect, useState } from "react"
import { LifeBuoy, MessageSquare, Send } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataTable } from "@/components/data-table"
import { AsyncBoundary, CardsSkeleton, ErrorState } from "@/components/async-boundary"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/primitives"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApiAll } from "@/lib/use-api"
import { getSupportRequests, getSupportStats, updateSupportRequest } from "@/lib/api"

const TONE = { Open: "red", Claimed: "pink", Resolved: "green" }

/**
 * The queue of conversations the chatbot handed over.
 *
 * Each ticket carries the transcript that led to it, so whoever picks it up can
 * see what the visitor already asked instead of making them repeat themselves.
 */
export default function Support() {
  const [openTicket, setOpenTicket] = useState(null)

  const { data, loading, error, refresh } = useApiAll(
    { tickets: () => getSupportRequests(), stats: () => getSupportStats() },
    [],
    { tickets: [], stats: null },
  )

  // Handoffs arrive while an admin is looking at the page.
  useEffect(() => {
    const timer = setInterval(refresh, 8000)
    return () => clearInterval(timer)
  }, [refresh])

  const tickets = data.tickets
  const byStatus = (status) => tickets.filter((t) => t.status === status)

  const columns = [
    { key: "id", header: "Ticket" },
    { key: "name", header: "From" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    { key: "question", header: "Question" },
    { key: "source", header: "Raised on" },
    {
      key: "raisedAt",
      header: "When",
      render: (r) => new Date(r.raisedAt).toLocaleString(),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge>,
    },
    {
      key: "open",
      header: "",
      export: false,
      render: (r) => (
        <Button size="xs" variant="outline" onClick={() => setOpenTicket(r)}>
          <MessageSquare />
          Open
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Support"
        description="Conversations the chatbot could not finish, handed to a person."
      />

      <AsyncBoundary loading={loading} error={error} onRetry={refresh} skeleton={<CardsSkeleton count={4} />}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open" value={data.stats?.open ?? 0} hint="waiting for someone" icon={LifeBuoy} tone={data.stats?.open ? "red" : "green"} />
          <StatCard label="Claimed" value={data.stats?.claimed ?? 0} hint="being handled" tone="pink" />
          <StatCard label="Resolved" value={data.stats?.resolved ?? 0} hint="closed out" tone="green" />
          <StatCard
            label="Total"
            value={data.stats?.total ?? 0}
            hint="handoffs all time"
            icon={MessageSquare}
            tone="blue"
          />
        </div>
      </AsyncBoundary>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">
            Open
            <Badge tone="red">{byStatus("Open").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="claimed">Claimed</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {[
          ["open", byStatus("Open"), "Nothing waiting — the bot is coping."],
          ["claimed", byStatus("Claimed"), "Nothing being handled right now."],
          ["resolved", byStatus("Resolved"), "Nothing resolved yet."],
          ["all", tickets, "No handoffs yet."],
        ].map(([value, rows, empty]) => (
          <TabsContent key={value} value={value}>
            <DataTable
              name={`support-${value}`}
              rows={rows}
              columns={columns}
              empty={loading ? "Loading…" : empty}
              searchPlaceholder="Search tickets…"
            />
          </TabsContent>
        ))}
      </Tabs>

      <TicketDialog
        ticket={openTicket}
        onClose={() => setOpenTicket(null)}
        onChanged={refresh}
      />
    </>
  )
}

/** The transcript, plus the controls to claim, reply and resolve. */
function TicketDialog({ ticket, onClose, onChanged }) {
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const act = async (payload) => {
    setBusy(true)
    setError(null)
    try {
      await updateSupportRequest(ticket.id, payload)
      setReply("")
      onChanged()
      if (payload.status === "Resolved") onClose()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{ticket?.id}</DialogTitle>
          <DialogDescription>
            {ticket ? `${ticket.name}${ticket.email ? ` · ${ticket.email}` : ""} · raised on ${ticket.source}` : ""}
          </DialogDescription>
        </DialogHeader>

        {ticket ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-secondary p-3">
              <span className="text-xs tracking-wide text-muted-foreground uppercase">Asked</span>
              <p className="text-sm font-medium">{ticket.question}</p>
            </div>

            <div>
              <span className="text-xs tracking-wide text-muted-foreground uppercase">Transcript</span>
              <div className="mt-2 flex max-h-56 flex-col gap-2 overflow-y-auto">
                {ticket.transcript.length ? (
                  ticket.transcript.map((m, i) => (
                    <div
                      key={i}
                      className={
                        m.from === "user"
                          ? "max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                          : m.from === "admin"
                            ? "max-w-[85%] self-start rounded-2xl rounded-bl-md bg-green-soft px-3 py-2 text-sm text-green-strong"
                            : "max-w-[85%] self-start rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm"
                      }
                    >
                      {m.text}
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No transcript captured.</span>
                )}
              </div>
            </div>

            <Separator />
            {error ? <ErrorState error={error} /> : null}

            <div className="flex flex-col gap-2">
              <Input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add a note or reply for the record…"
                aria-label="Reply"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy || !reply.trim()} onClick={() => act({ reply })}>
                  <Send />
                  Add reply
                </Button>
                {ticket.status === "Open" ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ status: "Claimed" })}>
                    Claim
                  </Button>
                ) : null}
                {ticket.status !== "Resolved" ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act({ status: "Resolved" })}>
                    Resolve
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Replies are recorded on the ticket for the team — the visitor is followed up by email.
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
