import { useState } from "react"
import { CreditCard, Plus, Trash2 } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { ErrorState } from "@/components/async-boundary"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useApiAll } from "@/lib/use-api"
import { getCards, getFaculty, getStudents, issueCard, revokeCard, setCardStatus } from "@/lib/api"

const STATUS_TONE = { Active: "green", Lost: "red", Deactivated: "pink" }

/**
 * The issued-RFID-card register for one cohort.
 *
 * A card only opens the attendance register while it is Active, so reporting
 * one lost here stops it at the gate immediately without losing its history.
 */
export function CardRegistry({ holderType = "student" }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const { data, loading, error: loadError, refresh } = useApiAll(
    {
      cards: () => getCards({ holderType }),
      people: () => (holderType === "faculty" ? getFaculty() : getStudents()),
    },
    [holderType],
    { cards: [], people: [] },
  )

  const act = async (fn) => {
    setError(null)
    try {
      await fn()
      refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <ErrorState error={error} /> : null}
      {loadError ? <ErrorState error={loadError} onRetry={refresh} /> : null}

      <DataTable
        name={`${holderType}-rfid-cards`}
        rows={data.cards}
        empty={loading ? "Loading…" : "No cards issued yet."}
        searchPlaceholder="Search by card UID or holder…"
        toolbar={
          <IssueCard
            people={data.people}
            holderType={holderType}
            onIssued={refresh}
            onError={setError}
          />
        }
        columns={[
          { key: "cardId", header: "Card UID" },
          { key: "holderId", header: holderType === "faculty" ? "Staff ID" : "Student ID" },
          { key: "holderName", header: "Holder" },
          {
            key: "status",
            header: "Status",
            render: (r) => <Badge tone={STATUS_TONE[r.status] ?? "pink"}>{r.status}</Badge>,
          },
          { key: "issuedAt", header: "Issued" },
          {
            key: "lastSeenAt",
            header: "Last tap",
            render: (r) => (r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString() : "—"),
          },
          {
            key: "actions",
            header: "",
            export: false,
            render: (r) => (
              <div className="flex gap-1.5">
                {r.status === "Active" ? (
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busy === r.cardId}
                    onClick={() => {
                      setBusy(r.cardId)
                      act(() => setCardStatus(r.cardId, "Lost"))
                    }}
                  >
                    Report lost
                  </Button>
                ) : (
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busy === r.cardId}
                    onClick={() => {
                      setBusy(r.cardId)
                      act(() => setCardStatus(r.cardId, "Active"))
                    }}
                  >
                    Reactivate
                  </Button>
                )}
                <Button
                  size="icon-xs"
                  variant="destructive"
                  aria-label={`Revoke ${r.cardId}`}
                  disabled={busy === r.cardId}
                  onClick={() => {
                    setBusy(r.cardId)
                    act(() => revokeCard(r.cardId))
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

function IssueCard({ people, holderType, onIssued, onError }) {
  const [cardId, setCardId] = useState("")
  const [holderId, setHolderId] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      // Separators are normalised server-side, so "9C FE 1A 4A" is fine as typed.
      await issueCard({ cardId, holderType, holderId: holderId || people[0]?.id })
      setCardId("")
      setHolderId("")
      onIssued()
    } catch (err) {
      onError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Plus />
          Issue card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue an RFID card</DialogTitle>
          <DialogDescription>
            Tap the card on a reader to read its UID, then key it in. Spacing and
            case do not matter — 9C FE 1A 4A and 9cfe1a4a are the same card.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-uid">Card UID</Label>
            <Input
              id="card-uid"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              placeholder="9C FE 1A 4A"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card-holder">Issue to</Label>
            <Select value={holderId || people[0]?.id} onValueChange={setHolderId}>
              <SelectTrigger id="card-holder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id} · {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="lg">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="lg" disabled={busy || !cardId.trim()} onClick={submit}>
              <CreditCard />
              {busy ? "Issuing…" : "Issue card"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
