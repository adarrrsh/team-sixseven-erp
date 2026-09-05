import { Separator as SeparatorPrimitive, Progress as ProgressPrimitive, Avatar as AvatarPrimitive } from "radix-ui"
import { cn } from "cn"

function Separator({ className, orientation = "horizontal", ...props }) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  )
}

function Progress({ className, value = 0, tone = "pink", ...props }) {
  const fill = {
    pink: "bg-pink",
    red: "bg-red",
    green: "bg-green",
    blue: "bg-blue",
  }[tone]
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

function Avatar({ className, ...props }) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-9 shrink-0 overflow-hidden rounded-full bg-pink-strong",
        className,
      )}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center text-xs font-semibold text-white",
        className,
      )}
      {...props}
    />
  )
}

export { Separator, Progress, Avatar, AvatarFallback }
