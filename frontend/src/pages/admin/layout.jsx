import { Outlet } from "react-router-dom"
import {
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
]

export default function AdminLayout() {
  return (
    <AppShell
      role="Admin portal"
      nav={NAV}
      user={{ name: "Priya Raghavan", meta: "Registrar · Admin" }}
    >
      <Outlet />
    </AppShell>
  )
}
