import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const CANNED = [
  "How do I apply for admission?",
  "What documents do I need?",
  "When does the semester start?",
]

const REPLY = {
  "How do I apply for admission?":
    "Use “Apply for admission” on the sign-in card. The form takes 4 minutes and ends with the application fee payment.",
  "What documents do I need?":
    "Class XII marksheet, a photo ID, and one passport photograph. You can upload them after the fee is paid.",
  "When does the semester start?":
    "Orientation is 28 September 2026; classes begin 1 October 2026.",
}

/** Support chatbot anchored to the lower corner of the login page. */
export function Chatbot() {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState([
    { from: "bot", text: "Hi — I'm the admissions helpdesk. Ask me anything." },
  ])
  const [draft, setDraft] = useState("")

  const send = (text) => {
    const q = (text ?? draft).trim()
    if (!q) return
    setDraft("")
    setLog((l) => [
      ...l,
      { from: "me", text: q },
      {
        from: "bot",
        text:
          REPLY[q] ??
          "I've noted that — an admissions officer will reply on your registered email within one working day.",
      },
    ])
  }

  return (
    <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex h-[26rem] w-[21rem] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_60px_-24px_rgba(24,10,20,0.35)]"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-2 rounded-full bg-green" />
              <span className="text-sm font-semibold">Admissions helpdesk</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>

            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
              {log.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.from === "me"
                      ? "max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[85%] self-start rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm text-foreground"
                  }
                >
                  {m.text}
                </div>
              ))}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {CANNED.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => send(c)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="flex items-center gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a question…"
                aria-label="Message"
              />
              <Button type="submit" size="icon-lg" aria-label="Send">
                <Send />
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!open ? (
        <motion.div whileHover={{ y: -2 }} className="flex items-center gap-2">
          <Badge tone="outline" className="hidden bg-card sm:inline-flex">
            Need help?
          </Badge>
          <Button
            size="icon-lg"
            className="size-12 rounded-2xl shadow-[0_10px_30px_-12px_rgba(214,51,132,0.7)]"
            aria-label="Open chat"
            onClick={() => setOpen(true)}
          >
            <MessageCircle className="size-5" />
          </Button>
        </motion.div>
      ) : null}
    </div>
  )
}
