import { useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, CreditCard, Download, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/primitives"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Chatbot } from "@/components/chatbot"
import { payApplicationFee } from "@/lib/api"
import { downloadCsv } from "@/lib/export"
import { inr } from "@/lib/utils"
import { cn } from "cn"

const PROGRAMS = [
  { id: "B.Tech CSE", fee: 2500 },
  { id: "B.Tech ECE", fee: 2500 },
  { id: "B.Tech MECH", fee: 2200 },
  { id: "B.Com Hons", fee: 1500 },
]

const STEPS = ["Applicant", "Programme", "Payment", "Receipt"]

export default function Apply() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    program: "B.Tech CSE",
    board: "",
    percentage: "",
    statement: "",
    card: "4242 4242 4242 4242",
    expiry: "09/29",
    cvv: "123",
  })
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target?.value ?? e }))

  const fee = PROGRAMS.find((p) => p.id === form.program)?.fee ?? 2500

  const pay = async () => {
    setBusy(true)
    const res = await payApplicationFee({
      name: form.name,
      email: form.email,
      program: form.program,
      amount: fee,
    })
    setReceipt(res)
    setBusy(false)
    setStep(3)
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft />
              Back to sign in
            </Link>
          </Button>
          <Badge tone="pink" className="ml-auto">
            Intake closes 30 Sep 2026
          </Badge>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Apply for admission
          </h1>
          <p className="text-sm text-muted-foreground">
            Four steps, about four minutes. The application fee is
            non-refundable and payable online.
          </p>
        </div>

        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                  i === step
                    ? "border-pink-strong bg-pink-strong text-white"
                    : i < step
                      ? "border-green-strong bg-green-strong text-white"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : <span className="tabular-nums">{i + 1}</span>}
                {s}
              </span>
            </li>
          ))}
        </ol>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col gap-5"
            >
              {step === 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" id="name">
                      <Input id="name" value={form.name} onChange={set("name")} placeholder="Ishaan Verma" />
                    </Field>
                    <Field label="Date of birth" id="dob">
                      <Input id="dob" type="date" value={form.dob} onChange={set("dob")} />
                    </Field>
                    <Field label="Email" id="email">
                      <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@mail.com" />
                    </Field>
                    <Field label="Phone" id="phone">
                      <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="98200 00000" />
                    </Field>
                  </div>
                  <Nav onNext={() => setStep(1)} />
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Programme" id="program">
                      <Select value={form.program} onValueChange={(v) => setForm((f) => ({ ...f, program: v }))}>
                        <SelectTrigger id="program">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAMS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.id} · {inr(p.fee)} fee
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Qualifying board" id="board">
                      <Input id="board" value={form.board} onChange={set("board")} placeholder="CBSE / State board" />
                    </Field>
                    <Field label="Class XII aggregate (%)" id="percentage">
                      <Input id="percentage" type="number" min="0" max="100" value={form.percentage} onChange={set("percentage")} placeholder="92" />
                    </Field>
                  </div>
                  <Field label="Why this programme?" id="statement">
                    <Textarea id="statement" value={form.statement} onChange={set("statement")} placeholder="A short paragraph — 100 words is plenty." />
                  </Field>
                  <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} />
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 text-green" />
                      <span className="text-sm font-medium">Dummy gateway · test mode</span>
                      <Badge tone="blue" className="ml-auto">
                        {inr(fee)} due
                      </Badge>
                    </div>
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr]">
                      <Field label="Card number" id="card">
                        <Input id="card" value={form.card} onChange={set("card")} inputMode="numeric" />
                      </Field>
                      <Field label="Expiry" id="expiry">
                        <Input id="expiry" value={form.expiry} onChange={set("expiry")} />
                      </Field>
                      <Field label="CVV" id="cvv">
                        <Input id="cvv" value={form.cvv} onChange={set("cvv")} />
                      </Field>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No real charge is made. The request is posted to the campus
                      backend at <code className="rounded-md bg-muted px-1.5 py-0.5">/api/payments/admission</code>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                      <ArrowLeft />
                      Back
                    </Button>
                    <Button size="lg" className="h-10" disabled={busy} onClick={pay}>
                      <CreditCard />
                      {busy ? "Processing…" : `Pay ${inr(fee)}`}
                    </Button>
                  </div>
                </>
              ) : null}

              {step === 3 && receipt ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-2xl bg-green-strong text-white">
                      <Check className="size-5" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold">Application submitted</span>
                      <span className="text-sm text-muted-foreground">
                        {receipt.offline
                          ? "Backend unreachable — receipt generated locally."
                          : "Payment confirmed by the campus backend."}
                      </span>
                    </div>
                  </div>

                  <dl className="grid gap-3 rounded-2xl bg-secondary p-4 sm:grid-cols-2">
                    <Row k="Application ID" v={receipt.applicationId} />
                    <Row k="Payment reference" v={receipt.reference} />
                    <Row k="Applicant" v={form.name || "—"} />
                    <Row k="Programme" v={form.program} />
                    <Row k="Amount paid" v={inr(receipt.amount ?? fee)} />
                    <Row k="Status" v="Pending review" />
                  </dl>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        downloadCsv(
                          "admission-receipt",
                          [
                            { key: "field", header: "Field" },
                            { key: "value", header: "Value" },
                          ],
                          [
                            { field: "Application ID", value: receipt.applicationId },
                            { field: "Reference", value: receipt.reference },
                            { field: "Applicant", value: form.name },
                            { field: "Programme", value: form.program },
                            { field: "Amount", value: receipt.amount ?? fee },
                          ],
                        )
                      }
                    >
                      <Download />
                      Download receipt
                    </Button>
                    <Button asChild size="lg">
                      <Link to="/">
                        Back to sign in
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Chatbot />
    </div>
  )
}

function Field({ label, id, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{k}</dt>
      <dd className="text-sm font-medium">{v}</dd>
    </div>
  )
}

function Nav({ onBack, onNext }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onBack ? (
        <Button variant="outline" size="lg" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
      ) : null}
      <Button size="lg" onClick={onNext}>
        Continue
        <ArrowRight />
      </Button>
    </div>
  )
}
