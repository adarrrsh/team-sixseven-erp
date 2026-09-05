import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { LifeBuoy,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { loadSession } from "@/lib/session"

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { heading: "Operations" },
  { to: "/admin/admissions", label: "Admissions", icon: UserPlus },
  { to: "/admin/faculty", label: "Faculty management", icon: Users },
  { to: "/admin/students", label: "Student management", icon: BookOpen },
  { to: "/admin/finances", label: "Finances", icon: Wallet },
  { heading: "Academics" },
  { to: "/admin/timetable", label: "Time-table", icon: CalendarDays },
  { to: "/admin/examinations", label: "Examinations", icon: ClipboardList },
  { to: "/admin/score", label: "Score", icon: Trophy },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const session = loadSession()

  useEffect(() => {
    if (!session || session.role !== "admin") navigate("/", { replace: true })
  }, [session, navigate])

  if (!session) return null

  return (
    <AppShell
      role="Admin portal"
      nav={NAV}
      user={{ name: session.name, meta: session.email }}
    >
      <Outlet />
    </AppShell>
  )
}
