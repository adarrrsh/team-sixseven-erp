import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

export function Skeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} {...props} />
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  )
}

export function CardsSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  )
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border border-red bg-red-soft p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-red-strong">
        <AlertTriangle className="size-4" />
        <span className="text-sm font-semibold">Could not load this data</span>
      </div>
      <p className="text-sm text-red-strong">
        {error?.message ?? "The campus backend did not respond."}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function AsyncBoundary({ loading, error, onRetry, skeleton, children }) {
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (loading) return skeleton ?? <TableSkeleton />
  return children
}
