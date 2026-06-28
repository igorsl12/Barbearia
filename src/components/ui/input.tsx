import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightIcon, ...props }, ref) => (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-ink-700">{label}</label>}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3.5 text-ink-400">{icon}</span>}
        <input
          ref={ref}
          className={cn(
            'w-full h-11 rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900',
            'placeholder:text-ink-400 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-400 focus:ring-red-400/60 focus:border-red-400',
            icon && 'pl-11',
            rightIcon && 'pr-11',
            className,
          )}
          {...props}
        />
        {rightIcon && <span className="absolute right-3.5 text-ink-400">{rightIcon}</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
