import { User, Scissors } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime, formatCurrency, formatDuration } from '@/lib/utils'
import type { Appointment } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

const STATUS_VARIANT: Record<string, 'pending' | 'confirmed' | 'cancelled' | 'completed'> = {
  pending: 'pending',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
  completed: 'completed',
}

interface AppointmentCardProps {
  appointment: Appointment
  onConfirm: (id: string) => void
  onReject: (id: string) => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
}

export function AppointmentCard({ appointment: appt, onConfirm, onReject, onComplete, onCancel }: AppointmentCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl bg-ink-900 text-cream px-3 py-2 flex-shrink-0">
          <span className="font-display text-xl font-bold leading-none tracking-wide">{formatTime(appt.date)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-ink-900 min-w-0">
              <User size={14} className="text-ink-400 flex-shrink-0" />
              <span className="truncate">{appt.profiles?.full_name ?? 'Cliente'}</span>
            </div>
            <Badge variant={STATUS_VARIANT[appt.status]}>
              {STATUS_LABEL[appt.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-ink-600">
            <Scissors size={13} className="text-ink-400 flex-shrink-0" />
            <span className="truncate">{appt.services?.name ?? '—'}</span>
            {appt.services && (
              <span className="text-ink-400 whitespace-nowrap">·&nbsp;{formatDuration(appt.services.duration)}&nbsp;·&nbsp;{formatCurrency(appt.services.price)}</span>
            )}
          </div>
        </div>
      </div>

      {appt.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
          <Button variant="success" size="sm" className="flex-1" onClick={() => onConfirm(appt.id)}>
            Confirmar
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => onReject(appt.id)}>
            Recusar
          </Button>
        </div>
      )}

      {appt.status === 'confirmed' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onComplete(appt.id)}>
            Concluído
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => onCancel(appt.id)}>
            Cancelar
          </Button>
        </div>
      )}
    </Card>
  )
}
