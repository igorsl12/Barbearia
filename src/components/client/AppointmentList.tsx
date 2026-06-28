import { Calendar, Clock, Scissors, CalendarClock } from 'lucide-react'
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
  onReschedule?: (appt: Appointment) => void
}

function ActionSection({
  appt,
  onCancel,
  onReschedule,
}: {
  appt: Appointment
  onCancel: (id: string) => void
  onReschedule?: (appt: Appointment) => void
}) {
  if (appt.status !== 'pending' && appt.status !== 'confirmed') return null
  const moreThan24h = new Date(appt.date) > new Date(Date.now() + 24 * 60 * 60 * 1000)
  const locked = !moreThan24h && appt.status === 'confirmed'

  if (locked) {
    return (
      <div className="mt-3 pt-3 border-t border-ink-100">
        <p className="text-xs text-ink-400">Alterações indisponíveis — menos de 24h para o horário.</p>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2">
      {onReschedule && (
        <Button variant="secondary" size="sm" onClick={() => onReschedule(appt)}>
          <CalendarClock size={14} />
          Remarcar
        </Button>
      )}
      <Button variant="danger" size="sm" onClick={() => onCancel(appt.id)}>
        Cancelar
      </Button>
    </div>
  )
}

export function AppointmentList({ appointments, loading, onCancel, onReschedule }: AppointmentListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-28 bg-ink-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-10 text-ink-400 border-dashed">
        <Scissors size={32} className="opacity-40" />
        <p className="text-sm">Nenhum agendamento ainda.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map(appt => (
        <Card key={appt.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink-900 truncate">{appt.services?.name ?? '—'}</p>
              <div className="flex items-center gap-1 mt-1 text-ink-500">
                <Calendar size={13} />
                <span className="text-xs">{formatDate(appt.date)}</span>
              </div>
              {appt.services && (
                <div className="flex items-center gap-1 text-ink-500 mt-0.5">
                  <Clock size={13} />
                  <span className="text-xs">{appt.services.duration} min · {formatCurrency(appt.services.price)}</span>
                </div>
              )}
            </div>
            <Badge variant={STATUS_VARIANT[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
          </div>
          <ActionSection appt={appt} onCancel={onCancel} onReschedule={onReschedule} />
        </Card>
      ))}
    </div>
  )
}
