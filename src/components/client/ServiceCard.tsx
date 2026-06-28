import { Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDuration, cn } from '@/lib/utils'
import type { Service } from '@/types'

interface ServiceCardProps {
  service: Service
  selected?: boolean
  onClick: () => void
}

export function ServiceCard({ service, selected, onClick }: ServiceCardProps) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card
        className={cn(
          'p-4 transition-all duration-200',
          selected
            ? 'border-brand-400 ring-2 ring-brand-400/50 shadow-glow'
            : 'hover:border-ink-200 hover:shadow-card',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 truncate">{service.name}</p>
            <div className="flex items-center gap-1 mt-1 text-ink-500">
              <Clock size={13} />
              <span className="text-xs">{formatDuration(service.duration)}</span>
            </div>
          </div>
          <span className="font-display text-lg font-bold text-ink-900 flex-shrink-0">
            {formatCurrency(service.price)}
          </span>
        </div>
      </Card>
    </button>
  )
}
