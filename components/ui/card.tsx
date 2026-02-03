import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('shadow-hard border-2 border-black bg-white p-4 md:p-6', className)}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export { Card }
