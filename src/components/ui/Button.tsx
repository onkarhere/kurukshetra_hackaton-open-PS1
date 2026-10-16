import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'h-7 px-2 text-xs rounded-control gap-1',
      sm: 'h-8 px-2.5 text-xs rounded-control gap-1.5',
      md: 'h-9 px-3.5 text-sm font-medium rounded-control gap-2',
      lg: 'h-11 px-5 text-base font-medium rounded-control gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-control justify-center items-center',
    }

    const variantClasses = {
      primary:
        'bg-accent text-accent-fg hover:bg-accent-hover transition-colors active:opacity-95 disabled:opacity-50 disabled:pointer-events-none',
      secondary:
        'bg-surface text-text hover:bg-surface-sunken border border-border-strong transition-colors active:opacity-95 disabled:opacity-50',
      outline:
        'border border-border-strong text-text hover:bg-surface-sunken transition-colors active:opacity-95 disabled:opacity-50',
      ghost:
        'text-text-muted hover:text-text hover:bg-surface-sunken transition-colors disabled:opacity-50',
      destructive:
        'bg-danger text-white hover:bg-danger/90 transition-colors active:opacity-95 disabled:opacity-50',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center select-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
