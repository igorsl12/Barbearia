import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-ink-900 text-cream hover:bg-ink-800 shadow-soft focus-visible:ring-ink-900',
  accent: 'bg-brand-400 text-ink-950 hover:bg-brand-300 shadow-glow focus-visible:ring-brand-500',
  secondary: 'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 focus-visible:ring-ink-300',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100 focus-visible:ring-ink-300',
  danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus-visible:ring-red-300',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 focus-visible:ring-emerald-300',
}

const sizes = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream'

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
