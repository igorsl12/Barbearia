import { useEffect, useState } from 'react'
import { Calendar, Clock, Scissors, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppointments } from '@/hooks/useAppointments'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, formatCurrency } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'completed' | 'cancelled'> = {
  completed: 'completed',
  cancelled: 'cancelled',
}

export function ClientHistory() {
  const { appointments, loading, loadHistory, clearHistory } = useAppointments()
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => { loadHistory() }, [loadHistory])

  async function handleClear() {
    setClearing(true)
    try {
      await clearHistory()
      toast.success('Histórico limpo.')
      setConfirmClear(false)
    } catch {
      toast.error('Erro ao limpar histórico.')
    } finally {
      setClearing(false)
    }
  }

  const clearAction =
    appointments.length > 0 ? (
      confirmClear ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500">Limpar tudo?</span>
          <button
            onClick={handleClear}
            disabled={clearing}
            className="text-xs font-semibold text-red-500 hover:text-red-700"
          >
            Confirmar
          </button>
          <button onClick={() => setConfirmClear(false)} className="text-xs text-ink-400 hover:text-ink-600">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmClear(true)}
          className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
        >
          <Trash2 size={15} />
          Limpar
        </button>
      )
    ) : undefined

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Histórico" backTo="/dashboard" actions={clearAction} />

      <main className="max-w-lg mx-auto px-4 py-6 animate-fade-up">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-ink-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-16 text-ink-400 border-dashed">
            <Scissors size={32} className="opacity-40" />
            <p className="text-sm">Nenhum histórico ainda.</p>
          </Card>
        ) : (
          <>
            <p className="text-xs text-ink-400 mb-3">{appointments.length} registro{appointments.length !== 1 ? 's' : ''}</p>
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
                    <Badge variant={STATUS_VARIANT[appt.status]}>
                      {STATUS_LABEL[appt.status]}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
