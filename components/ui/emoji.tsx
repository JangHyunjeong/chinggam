import * as React from 'react'
import { cn } from '@/lib/utils'

interface EmojiProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string
  symbol: string
}

const Emoji = React.forwardRef<HTMLSpanElement, EmojiProps>(
  ({ className, label, symbol, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-block', className)}
      role="img"
      aria-label={label || ''}
      aria-hidden={label ? 'false' : 'true'}
      {...props}
    >
      {symbol}
    </span>
  ),
)
Emoji.displayName = 'Emoji'

export { Emoji }
