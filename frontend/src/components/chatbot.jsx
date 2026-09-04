import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { askChatbot } from "@/lib/api"

const CANNED = [
  "How do I apply for admission?",
  "What documents do I need?",
  "When does the semester start?",
]

const SUPPORT_FALLBACK =
  "I couldn't help with that — please contact our support team at support@origin.edu and they'll get back to you."

/**
 * Support chatbot anchored to the lower corner of the login page. Every
 * message goes to the backend's Gemini proxy (`POST /api/chatbot`) — the
 * quick-reply chips just prefill a common question, they don't shortcut the
 * AI. Anything the backend can't answer confidently comes back as the same
 * fixed support-contact line, whether that's the model declining or the
 * request failing outright.
 */
export function Chatbot() {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState([
    { from: "bot", text: "Hi — I'm the admissions helpdesk. Ask me anything." },
  ])
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)

  const send = async (text) => {
    const q = (text ?? draft).trim()
    if (!q || busy) return
    setDraft("")
    setLog((l) => [...l, { from: "me", text: q }])
    setBusy(true)
    try {
      const { reply } = await askChatbot(q)
      setLog((l) => [...l, { from: "bot", text: reply || SUPPORT_FALLBACK }])
    } catch {
      setLog((l) => [...l, { from: "bot", text: SUPPORT_FALLBACK }])
    } finally {
      setBusy(false)
    }
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
                      ? "max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm whitespace-pre-line text-primary-foreground"
                      : "max-w-[85%] self-start rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm whitespace-pre-line text-foreground"
                  }
                >
                  {m.text}
                </div>
              ))}
              {busy ? (
                <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Typing…
                </div>
              ) : null}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {CANNED.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={busy}
                    onClick={() => send(c)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground disabled:pointer-events-none disabled:opacity-50"
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
                disabled={busy}
              />
              <Button type="submit" size="icon-lg" aria-label="Send" disabled={busy}>
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
