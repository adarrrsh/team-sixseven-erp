import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, GraduationCap, Lock, Mail, PanelsTopLeft, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/primitives"
import { HeroWindow } from "@/components/hero-window"
import { Chatbot } from "@/components/chatbot"
import { ErrorState } from "@/components/async-boundary"
import { useApi } from "@/lib/use-api"
import { getDashboard, login } from "@/lib/api"
import { cn } from "cn"

const ROLES = [
  { id: "admin", label: "Admin", icon: ShieldCheck, to: "/admin", hint: "registrar@origin.edu" },
  { id: "faculty", label: "Faculty", icon: Users, to: "/faculty", hint: "aparna.joshi@origin.edu" },
  { id: "student", label: "Student", icon: GraduationCap, to: "/student", hint: "aisha.s@origin.edu" },
]

export default function Login() {
  const [role, setRole] = useState("admin")
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const active = ROLES.find((r) => r.id === role)

  // Headline figures under the hero, straight from the institute record.
  const { data: stats } = useApi(() => getDashboard(), [], null)

  /**
   * Credentials are checked by the backend, which also says which portal the
   * account belongs to — so a faculty login cannot land on the admin console.
   */
  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    try {
      const { user, portal } = await login(
        form.get("email"),
        form.get("password"),
        role,
      )
      navigate(portal, { state: { user } })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <PanelsTopLeft className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-semibold tracking-[-0.01em]">Origin</span>
              <span className="text-xs text-muted-foreground">Campus ERP</span>
            </div>
            <Badge tone="pink" className="ml-2">
              AY 2026 – 27
            </Badge>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-[-0.035em] sm:text-5xl">
              One campus, one record.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground">
              Admissions, timetables, attendance, fees, exams and scores — for
              admins, faculty and students, in a single place.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-secondary p-5 sm:p-7">
            <HeroWindow className="h-auto w-full" />
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li>{stats ? `${stats.counts.students} students` : "— students"}</li>
            <li>{stats ? `${stats.counts.faculty} faculty` : "— faculty"}</li>
            <li>{stats ? `${stats.studentsByDept.length} departments` : "— departments"}</li>
            <li>Every table exports to .csv / .xlsx</li>
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
          className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-[0_20px_50px_-32px_rgba(24,10,20,0.4)] sm:p-8"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Accounts are issued by the registrar's office.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Portal">
            {ROLES.map((r) => {
              const on = r.id === role
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors",
                    on
                      ? "border-pink-strong bg-pink-strong text-white"
                      : "border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                  )}
                >
                  <r.icon className="size-4" />
                  <span className="text-sm font-medium">{r.label}</span>
                </button>
              )
            })}
          </div>

          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Institute email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={active.hint}
                  key={active.hint}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue="origin-demo"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {error ? <ErrorState error={error} /> : null}

            <Button type="submit" size="lg" className="h-10" disabled={busy}>
              {busy ? "Signing in…" : `Sign in as ${active.label}`}
              <ArrowRight />
            </Button>
          </form>

          <Separator />

          <div className="flex flex-col gap-2.5 rounded-2xl bg-pink-strong p-4">
            <span className="text-sm font-medium text-white">
              New here?
            </span>
            <p className="text-sm text-white">
              Applications for the 2026 – 27 intake close on 30 September.
            </p>
            <Button asChild variant="outline" size="lg" className="w-fit">
              <Link to="/apply">
                Apply for admission
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </motion.section>
      </div>

      <Chatbot />
    </div>
  )
}
