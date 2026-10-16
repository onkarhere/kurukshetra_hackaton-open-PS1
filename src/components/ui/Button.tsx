import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'ai' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
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
      sm: 'h-8 px-2.5 text-xs rounded-btn gap-1.5',
      md: 'h-9 px-3.5 text-xs font-medium rounded-btn gap-2',
      lg: 'h-11 px-5 text-sm font-medium rounded-btn gap-2.5',
      icon: 'h-9 w-9 p-0 rounded-btn justify-center items-center',
    }

    const variantClasses = {
      primary:
        'bg-primary text-white hover:bg-primary-hover shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none',
      secondary:
        'bg-surface-2 text-fg hover:bg-surface border border-border hover:border-text-muted/30 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50',
      outline:
        'border border-border text-fg hover:bg-surface-2 active:scale-[0.98] transition-all disabled:opacity-50',
      ghost:
        'text-fg-muted hover:text-fg hover:bg-surface-2 transition-all disabled:opacity-50',
      destructive:
        'bg-danger text-white hover:bg-danger/90 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50',
      ai:
        'border border-ai text-ai hover:bg-ai/10 active:scale-[0.98] shadow-sm transition-all focus-visible:ring-ai disabled:opacity-50 group',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center select-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            {variant === 'ai' && !leftIcon && (
              <Sparkles className="w-3.5 h-3.5 text-ai transition-transform group-hover:rotate-12" />
            )}
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
