import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Menu, PanelsTopLeft, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/primitives"
import { initials } from "@/lib/utils"
import { clearSession } from "@/lib/session"
import { cn } from "cn"

function NavItem({ to, icon: Icon, label, end, onClick, className }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 items-center gap-2 rounded-[100px] px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors",
          isActive
            ? "bg-pink-strong text-white"
            : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
          className,
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}

export function AppShell({ user, nav, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [openedAt, setOpenedAt] = useState(location.pathname)
  const links = nav.filter((item) => !item.heading)

  const signOut = () => {
    clearSession()
    navigate("/")
  }

  if (location.pathname !== openedAt) {
    setOpenedAt(location.pathname)
    setOpen(false)
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="fixed inset-x-0 top-4 z-50 flex flex-col items-center px-4">
        <nav className="flex w-full max-w-full items-center gap-1 rounded-[100px] border border-border bg-card px-2 py-2 shadow-[0_8px_24px_rgba(24,10,20,0.08)] lg:w-auto">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <PanelsTopLeft className="size-4" />
          </span>

          <div className="mx-1 h-5 w-px shrink-0 bg-border" />

          <div className="hidden items-center gap-1 lg:flex">
            {links.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <div className="mx-1 hidden h-5 w-px shrink-0 bg-border lg:block" />

          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="hidden shrink-0 items-center gap-2 rounded-[100px] py-1 pr-3 pl-1 transition-colors hover:bg-secondary lg:flex"
          >
            <Avatar>
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <LogOut className="size-4 text-muted-foreground" />
          </button>
        </nav>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="mt-2 flex w-56 max-w-[calc(100vw-2rem)] flex-col gap-1 rounded-3xl border border-border bg-card p-2 shadow-[0_8px_24px_rgba(24,10,20,0.08)] lg:hidden"
            >
              {links.map((item) => (
                <NavItem key={item.to} {...item} onClick={() => setOpen(false)} className="w-full" />
              ))}

              <div className="my-1 h-px shrink-0 bg-border" />

              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  signOut()
                }}
                className="flex w-full shrink-0 items-center gap-2 rounded-[100px] px-3.5 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              >
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">{initials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="flex-1">{user.name}</span>
                <LogOut className="size-4 shrink-0" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
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
