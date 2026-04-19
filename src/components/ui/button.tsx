import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed active:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2'

    const variants = {
      primary: 'bg-black text-white hover:opacity-90 focus:ring-black',
      secondary: 'bg-white text-black border border-gray-200 hover:bg-gray-50 focus:ring-gray-300',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
      danger: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus:ring-red-300',
      success: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 focus:ring-green-300',
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    }

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
  }
)
Button.displayName = 'Button'
