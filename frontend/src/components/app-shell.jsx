import { NavLink, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { LogOut, PanelsTopLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/primitives"
import { initials } from "@/lib/utils"
import { cn } from "cn"

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 items-center gap-2 rounded-[100px] px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
          isActive
            ? "bg-pink-strong text-white"
            : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )
}

/**
 * Shared chrome for all three portals: one fixed, pilled navbar up top —
 * brand mark, section links, identity + sign-out — and nothing else. No
 * separate top bar, no side rail. Page content fades in on mount only.
 */
export function AppShell({ user, nav, children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-svh bg-background">
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-[100px] border border-border bg-card px-2 py-2 shadow-[0_8px_24px_rgba(24,10,20,0.08)]">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <PanelsTopLeft className="size-4" />
          </span>

          <div className="mx-1 h-5 w-px shrink-0 bg-border" />

          {nav
            .filter((item) => !item.heading)
            .map((item) => (
              <NavItem key={item.to} {...item} />
            ))}

          <div className="mx-1 h-5 w-px shrink-0 bg-border" />

          <button
            type="button"
            onClick={() => navigate("/")}
            title="Sign out"
            className="flex shrink-0 items-center gap-2 rounded-[100px] py-1 pr-3 pl-1 transition-colors hover:bg-secondary"
          >
            <Avatar>
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <LogOut className="size-4 text-muted-foreground" />
          </button>
        </nav>
      </header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-1 flex-col gap-6 px-5 pt-24 pb-6 lg:px-8 lg:pt-28 lg:pb-8"
      >
        {children}
      </motion.main>
    </div>
  )
}
