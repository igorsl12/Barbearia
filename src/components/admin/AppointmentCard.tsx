import { User, Clock, Scissors } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime, formatCurrency } from '@/lib/utils'
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={14} className="text-gray-400 flex-shrink-0" />
            <span className="font-bold text-gray-900">{formatTime(appt.date)}</span>
            <Badge variant={STATUS_VARIANT[appt.status]}>
              {STATUS_LABEL[appt.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-700">
            <User size={13} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{appt.profiles?.full_name ?? 'Cliente'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
            <Scissors size={13} className="text-gray-400 flex-shrink-0" />
            <span>{appt.services?.name ?? '—'}</span>
            {appt.services && (
              <span className="text-gray-400">·&nbsp;{appt.services.duration}min&nbsp;·&nbsp;{formatCurrency(appt.services.price)}</span>
            )}
          </div>
        </div>
      </div>

      {appt.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <Button variant="success" size="sm" className="flex-1" onClick={() => onConfirm(appt.id)}>
            Confirmar
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={() => onReject(appt.id)}>
            Recusar
          </Button>
        </div>
      )}

      {appt.status === 'confirmed' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onComplete(appt.id)}>
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
