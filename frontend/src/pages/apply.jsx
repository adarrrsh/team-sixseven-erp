import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Lock, Send } from "lucide-react"
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
import { ErrorState } from "@/components/async-boundary"
import { useApi } from "@/lib/use-api"
import { getProgrammeFees, registerApplicant } from "@/lib/api"
import { saveSession } from "@/lib/session"
import { inr } from "@/lib/utils"
import { cn } from "cn"

const STEPS = ["Applicant", "Programme", "Account"]

/**
 * The admission form. It opens an applicant account and files the request —
 * no money changes hands here. The seat fee only becomes payable from the
 * applicant portal once the registrar approves.
 */
export default function Apply() {
  const navigate = useNavigate()
  const { data: programmes } = useApi(() => getProgrammeFees(), [], [])

  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    program: "B.Tech CSE",
    board: "",
    percentage: "",
    statement: "",
    password: "",
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }))
  const seatFee = programmes.find((p) => p.program === form.program)?.seatFee

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const { application } = await registerApplicant({
        ...form,
        percentage: Number(form.percentage) || 0,
      })
      saveSession({
        email: form.email,
        name: form.name,
        role: "applicant",
        linkedId: application.id,
      })
      navigate("/applicant")
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
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
            Three steps, about four minutes. Nothing is payable now — if the
            registrar approves your application, the seat fee becomes payable
            from your applicant portal.
          </p>
        </div>

        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                  i === step
                    ? "border-pink bg-pink-soft text-pink-strong"
                    : i < step
                      ? "border-green bg-green-soft text-green-strong"
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
                  <Nav onNext={() => setStep(1)} nextDisabled={!form.name || !form.email} />
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
                          {programmes.map((p) => (
                            <SelectItem key={p.program} value={p.program}>
                              {p.program} · {inr(p.seatFee)} seat fee
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
                  {seatFee ? (
                    <p className="text-xs text-muted-foreground">
                      Seat fee for this programme is {inr(seatFee)}, payable only
                      after approval.
                    </p>
                  ) : null}
                  <Nav onBack={() => setStep(0)} onNext={() => setStep(2)} />
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="size-4 text-green" />
                      <span className="text-sm font-medium">
                        Create your applicant login
                      </span>
                    </div>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      Sign in with this to track your application. We will show
                      the registrar's decision here as soon as it is made.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Email" id="acc-email">
                        <Input id="acc-email" value={form.email} onChange={set("email")} type="email" />
                      </Field>
                      <Field label="Choose a password" id="password">
                        <Input id="password" type="password" value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
                      </Field>
                    </div>
                  </div>

                  {error ? <ErrorState error={error} /> : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                      <ArrowLeft />
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="h-10"
                      disabled={busy || !form.email || form.password.length < 6}
                      onClick={submit}
                    >
                      <Send />
                      {busy ? "Submitting…" : "Submit application"}
                    </Button>
                  </div>
                </>
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

function Nav({ onBack, onNext, nextDisabled }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onBack ? (
        <Button variant="outline" size="lg" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
      ) : null}
      <Button size="lg" onClick={onNext} disabled={nextDisabled}>
        Continue
        <ArrowRight />
      </Button>
    </div>
  )
}
