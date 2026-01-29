import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white border-2 border-black shadow-hard p-4 md:p-6",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

export { Card }
