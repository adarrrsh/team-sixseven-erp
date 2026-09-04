import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "cn"

const TONE = {
  pink: { chip: "bg-pink-soft text-pink-strong", value: "text-foreground" },
  red: { chip: "bg-red-soft text-red-strong", value: "text-foreground" },
  green: { chip: "bg-green-soft text-green-strong", value: "text-foreground" },
  blue: { chip: "bg-blue-soft text-blue-strong", value: "text-foreground" },
}

export function StatCard({ label, value, hint, icon: Icon, tone = "pink", delta }) {
  const t = TONE[tone]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <Card className="gap-3">
        <CardContent className="flex items-start gap-3">
          {Icon ? (
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", t.chip)}>
              <Icon className="size-4" />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </span>
            <span className={cn("text-2xl leading-tight font-semibold tracking-[-0.02em]", t.value)}>
              {value}
            </span>
            {hint || delta ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {delta ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 font-medium",
                      delta.startsWith("-")
                        ? "bg-red-soft text-red-strong"
                        : "bg-green-soft text-green-strong",
                    )}
                  >
                    {delta}
                  </span>
                ) : null}
                {hint}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
