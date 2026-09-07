import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex w-fit items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variant === "default" && "border-transparent bg-primary text-primary-foreground",
        variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground",
        variant === "destructive" && "border-transparent bg-destructive text-white",
        variant === "outline" && "text-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
