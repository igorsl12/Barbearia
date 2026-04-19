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
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left transition-all',
        selected && 'ring-2 ring-black rounded-xl',
      )}
    >
      <Card className={cn('p-4', selected && 'border-black')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{service.name}</p>
            <div className="flex items-center gap-1 mt-1 text-gray-500">
              <Clock size={13} />
              <span className="text-xs">{formatDuration(service.duration)}</span>
            </div>
          </div>
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(service.price)}
          </span>
        </div>
      </Card>
    </button>
  )
}
