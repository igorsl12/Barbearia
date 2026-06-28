import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

const variants = {
  default: 'bg-ink-100 text-ink-700 ring-ink-200',
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-red-100 text-red-700 ring-red-200',
  completed: 'bg-ink-100 text-ink-500 ring-ink-200',
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
