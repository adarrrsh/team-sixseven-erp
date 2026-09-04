import { Label as LabelPrimitive } from "radix-ui"
import { cn } from "cn"

function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-sm leading-none font-medium text-foreground select-none",
        className,
      )}
      {...props}
    />
  )
}

export { Label }
