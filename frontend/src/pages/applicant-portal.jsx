import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  BadgeCheck,
  Clock,
  CreditCard,
  KeyRound,
  LogOut,
  PanelsTopLeft,
  XCircle,
} from "lucide-react"
import { RadialGauge } from "@/components/charts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/primitives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AsyncBoundary, ErrorState, Skeleton } from "@/components/async-boundary"
import { Chatbot } from "@/components/chatbot"
import { useApi } from "@/lib/use-api"
import { getApplicantStatus, payAdmissionFee } from "@/lib/api"
import { clearSession, loadSession } from "@/lib/session"
import { inr } from "@/lib/utils"
import { cn } from "cn"

/** How often the portal re-checks for the registrar's decision. */
const POLL_MS = 5000

export default function ApplicantPortal() {
  const navigate = useNavigate()
  const session = loadSession()

  useEffect(() => {
    if (!session || session.role !== "applicant") navigate("/", { replace: true })
  }, [session, navigate])

  const { data, error, loading, setData, refresh } = useApi(
    () => getApplicantStatus(session?.email),
    [session?.email],
    null,
  )

  // A decision made in the admin console lands here without a manual refresh.
  useEffect(() => {
    if (data?.stage === "confirmed" || data?.stage === "rejected") return
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [data?.stage, refresh])

  const signOut = () => {
    clearSession()
    navigate("/")
  }

  if (!session) return null

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <PanelsTopLeft className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-[-0.01em]">Origin</span>
            <span className="text-xs text-muted-foreground">Applicant portal</span>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
            <LogOut />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={refresh}
          skeleton={<Skeleton className="h-64 w-full" />}
        >
          {data ? (
            <Stage data={data} onPaid={(next) => setData(next)} />
          ) : null}
        </AsyncBoundary>
      </main>

      <Chatbot />
    </div>
  )
}

/** One card per lifecycle stage — the backend decides which one applies. */
function Stage({ data, onPaid }) {
  const { stage, application } = data

  if (stage === "rejected") return <Rejected application={application} />
  if (stage === "confirmed") {
    return <Confirmed application={application} credentials={data.credentials} />
  }
  if (stage === "awaiting-payment") {
    return <AwaitingPayment application={application} onPaid={onPaid} />
  }
  return <UnderReview application={application} />
}

/** Static so Tailwind's scanner can see every class it needs to emit. */
const TONE = {
  pink: "bg-pink-soft text-pink-strong",
  green: "bg-green-soft text-green-strong",
  red: "bg-red-soft text-red-strong",
}

function Shell({ icon: Icon, tone, title, description, progress, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className={cn("grid size-10 place-items-center rounded-2xl", TONE[tone])}>
              <Icon className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {progress != null ? (
              <RadialGauge
                value={progress}
                tone={tone === "red" ? "red" : "green"}
                size={56}
                thickness={6}
                className="ml-auto shrink-0"
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">{children}</CardContent>
      </Card>
    </motion.div>
  )
}

function Summary({ application, children }) {
  return (
    <dl className="grid gap-3 rounded-2xl bg-secondary p-4 sm:grid-cols-2">
      <Row k="Application ID" v={application.id} />
      <Row k="Applicant" v={application.name} />
      <Row k="Programme" v={application.program} />
      <Row k="Applied on" v={application.applied} />
      {children}
    </dl>
  )
}

function UnderReview({ application }) {
  return (
    <Shell
      icon={Clock}
      tone="pink"
      title="Application under review"
      description="The registrar's office has your request."
      progress={33}
    >
      <Summary application={application}>
        <Row k="Status" v={<Badge tone="pink">Pending review</Badge>} />
        <Row k="Seat fee" v={`${inr(application.fee)} · payable after approval`} />
      </Summary>
      <p className="text-sm text-muted-foreground">
        Nothing is payable yet. This page updates on its own the moment a
        decision is recorded — you do not need to refresh.
      </p>
    </Shell>
  )
}

/** A rejected applicant sees this and nothing else. */
function Rejected({ application }) {
  return (
    <Shell
      icon={XCircle}
      tone="red"
      title="Application rejected"
      description={`Application ${application.id} was not successful this intake.`}
    >
      <p className="text-sm text-muted-foreground">
        We are sorry — your application for {application.program} has not been
        accepted. No fee is payable. You are welcome to apply again in the next
        intake.
      </p>
      <Separator />
      <p className="text-xs text-muted-foreground">
        For questions about this decision, contact the registrar's office
        quoting {application.id}.
      </p>
    </Shell>
  )
}

function AwaitingPayment({ application, onPaid }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const pay = async () => {
    setBusy(true)
    setError(null)
    try {
      const receipt = await payAdmissionFee({ applicationId: application.id })
      // Re-render straight into the confirmed stage with the issued login.
      onPaid({
        stage: "confirmed",
        application: {
          ...application,
          feeStatus: "Paid",
          paidAt: receipt.paidAt,
          paymentRef: receipt.reference,
          studentId: receipt.credentials?.studentId ?? receipt.studentId ?? "",
        },
        credentials: receipt.credentials ?? null,
      })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell
      icon={BadgeCheck}
      tone="green"
      title="Congratulations — you have a seat"
      description="Confirm it by paying the admission fee."
      progress={66}
    >
      <Summary application={application}>
        <Row k="Status" v={<Badge tone="green">Approved</Badge>} />
        <Row k="Decision recorded" v={application.decidedAt || "—"} />
      </Summary>

      <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CreditCard className="size-4 text-green" />
          <span className="text-sm font-medium">Admission fee</span>
          <Badge tone="blue" className="ml-auto">
            {inr(application.fee)} due
          </Badge>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          Dummy gateway in test mode — no real charge is made. Paying confirms
          your seat and issues your student login.
        </p>
        {error ? <ErrorState error={error} /> : null}
        <Button size="lg" className="h-10 w-fit" disabled={busy} onClick={pay}>
          <CreditCard />
          {busy ? "Processing…" : `Pay ${inr(application.fee)}`}
        </Button>
      </div>
    </Shell>
  )
}

function Confirmed({ application, credentials }) {
  return (
    <Shell
      icon={BadgeCheck}
      tone="green"
      title="Admission confirmed"
      description="Your seat is secured and your fee has been received."
      progress={100}
    >
      <Summary application={application}>
        <Row k="Fee status" v={<Badge tone="green">Paid</Badge>} />
        <Row k="Amount paid" v={inr(application.fee)} />
        <Row k="Payment reference" v={application.paymentRef || "—"} />
        <Row k="Student ID" v={application.studentId || "—"} />
      </Summary>

      <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-pink" />
          <span className="text-sm font-medium">Your student login</span>
        </div>
        {credentials?.password ? (
          <>
            <p className="text-sm text-muted-foreground">
              Copy these now — the password is shown only this once.
            </p>
            <dl className="grid gap-3 rounded-2xl bg-secondary p-4 sm:grid-cols-2">
              <Row k="Sign in with" v={<code className="text-sm">{credentials.email}</code>} />
              <Row k="Password" v={<code className="text-sm">{credentials.password}</code>} />
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Student ID <span className="font-medium text-foreground">{application.studentId}</span>.
            Your login was issued when the fee cleared — if you did not note the
            password down, the registrar's office can reset it for you.
          </p>
        )}
        <Button asChild variant="outline" size="lg" className="w-fit">
          <Link to="/">Go to sign in</Link>
        </Button>
      </div>
    </Shell>
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
