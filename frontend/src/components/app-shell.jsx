import { NavLink, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { LogOut, PanelsTopLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, Separator } from "@/components/ui/primitives"
import { Badge } from "@/components/ui/badge"
import { initials } from "@/lib/utils"
import { cn } from "cn"

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-pink-strong text-white"
            : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

/**
 * Shared chrome for all three portals: rail of sections on the left,
 * identity + sign-out on top. Page content fades in on mount only —
 * no scroll-driven animation anywhere in the app.
 */
export function AppShell({ role, user, nav, children }) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <PanelsTopLeft className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-[-0.01em]">Origin</span>
            <span className="text-xs text-muted-foreground">Campus ERP</span>
          </div>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {nav.map((item) =>
            item.heading ? (
              <span
                key={item.heading}
                className="mt-3 px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {item.heading}
              </span>
            ) : (
              <NavItem key={item.to} {...item} />
            ),
          )}
        </nav>

        <div className="flex items-center gap-2.5 rounded-2xl border border-sidebar-border bg-card p-2.5">
          <Avatar>
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.meta}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label="Sign out"
            onClick={() => navigate("/")}
          >
            <LogOut />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-5 py-3 lg:px-8">
          <Badge tone="pink" className="lg:hidden">
            Origin
          </Badge>
          <Badge tone="outline">{role}</Badge>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Academic year 2026 – 27 · Semester in progress
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="green">Backend online</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Switch portal
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
          {nav
            .filter((i) => !i.heading)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                    isActive
                      ? "bg-pink-strong text-white"
                      : "text-muted-foreground hover:bg-secondary",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col gap-6 px-5 py-6 lg:px-8 lg:py-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}
