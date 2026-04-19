import { Calendar, Clock, Scissors } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Appointment } from '@/types'

const STATUS_VARIANT: Record<string, 'pending' | 'confirmed' | 'cancelled' | 'completed'> = {
  pending: 'pending',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
  completed: 'completed',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Aguardando confirmação',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
}

interface AppointmentListProps {
  appointments: Appointment[]
  loading: boolean
  onCancel: (id: string) => void
}

function CancelSection({ appt, onCancel }: { appt: Appointment; onCancel: (id: string) => void }) {
  if (appt.status !== 'pending' && appt.status !== 'confirmed') return null
  const moreThan24h = new Date(appt.date) > new Date(Date.now() + 24 * 60 * 60 * 1000)
  if (!moreThan24h && appt.status === 'confirmed') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">Cancelamento indisponível — menos de 24h para o horário.</p>
      </div>
    )
  }
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <Button variant="danger" size="sm" onClick={() => onCancel(appt.id)}>
        Cancelar agendamento
      </Button>
    </div>
  )
}

export function AppointmentList({ appointments, loading, onCancel }: AppointmentListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
        <Scissors size={32} className="opacity-40" />
        <p className="text-sm">Nenhum agendamento ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map(appt => (
        <Card key={appt.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{appt.services?.name ?? '—'}</p>
              <div className="flex items-center gap-1 mt-1 text-gray-500">
                <Calendar size={13} />
                <span className="text-xs">{formatDate(appt.date)}</span>
              </div>
              {appt.services && (
                <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                  <Clock size={13} />
                  <span className="text-xs">{appt.services.duration} min · {formatCurrency(appt.services.price)}</span>
                </div>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[appt.status]}>
              {STATUS_LABEL[appt.status]}
            </Badge>
          </div>
          <CancelSection appt={appt} onCancel={onCancel} />
        </Card>
      ))}
    </div>
  )
}
