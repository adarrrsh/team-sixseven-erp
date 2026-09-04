import { cva } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        pink: "bg-pink-soft text-pink-strong",
        red: "bg-red-soft text-red-strong",
        green: "bg-green-soft text-green-strong",
        blue: "bg-blue-soft text-blue-strong",
        solid: "bg-primary text-primary-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
)

function Badge({ className, tone, ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone }), className)}
      {...props}
    />
  )
}

/** Shared status → tone map so every screen colours a status identically. */
const STATUS_TONE = {
  Approved: "green",
  Paid: "green",
  Active: "green",
  Completed: "green",
  Present: "green",
  Pending: "pink",
  Partial: "pink",
  Processing: "blue",
  Scheduled: "blue",
  Draft: "neutral",
  Unassigned: "neutral",
  "On leave": "blue",
  Rejected: "red",
  Overdue: "red",
  Unpaid: "red",
  Hold: "red",
  Probation: "red",
  Absent: "red",
}

function StatusBadge({ value, className }) {
  return (
    <Badge tone={STATUS_TONE[value] ?? "neutral"} className={className}>
      {value}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge, STATUS_TONE }
