import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center border-2 border-black font-mono text-sm font-bold whitespace-nowrap ring-offset-white transition-all focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-50',
          {
            'shadow-hard bg-orange-500 text-black hover:bg-orange-400': variant === 'primary',
            'shadow-hard bg-white text-black hover:bg-gray-100': variant === 'outline',
            'border-transparent bg-transparent shadow-none hover:bg-gray-100 hover:text-black':
              variant === 'ghost',
            'h-10 px-4 py-2': size === 'default',
            'h-9 px-3': size === 'sm',
            'text-md h-11 px-8': size === 'lg',
          },
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
