import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Scissors, User, Trash2, ChevronDown } from 'lucide-react'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { useAppointments } from '@/hooks/useAppointments'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'

type StatusFilter = 'all' | 'completed' | 'cancelled'
type PeriodFilter = 'all' | 'day' | 'week' | 'month'

const STATUS_LABEL: Record<string, string> = {
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'completed' | 'cancelled'> = {
  completed: 'completed',
  cancelled: 'cancelled',
}

function getDateRange(period: PeriodFilter): { from?: string; to?: string } {
  const now = new Date()
  if (period === 'day') return {
    from: startOfDay(now).toISOString(),
    to: endOfDay(now).toISOString(),
  }
  if (period === 'week') return {
    from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
    to: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
  }
  if (period === 'month') return {
    from: startOfMonth(now).toISOString(),
    to: endOfMonth(now).toISOString(),
  }
  return {}
}

function Select({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex-1">
      <label className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-1.5 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-ink-200 rounded-xl px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:ring-1 focus:ring-ink-900 cursor-pointer pr-8"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
      </div>
    </div>
  )
}

export function AdminHistory() {
  const { appointments, loading, loadAllHistory, clearAllHistory } = useAppointments()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    const { from, to } = getDateRange(period)
    loadAllHistory(from, to)
  }, [period, loadAllHistory])

  const filtered = status === 'all'
    ? appointments
    : appointments.filter(a => a.status === status)

  async function handleClear() {
    setClearing(true)
    try {
      const { from, to } = getDateRange(period)
      await clearAllHistory(from, to)
      const { from: f, to: t } = getDateRange(period)
      await loadAllHistory(f, t)
      toast.success('Histórico limpo.')
      setConfirmClear(false)
    } catch {
      toast.error('Erro ao limpar histórico.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-ink-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="p-1.5 hover:bg-ink-100 rounded-lg">
              <ArrowLeft size={20} />
            </Link>
            <span className="font-semibold text-ink-900">Histórico</span>
          </div>
          {appointments.length > 0 && (
            <div className="flex items-center gap-2">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500">Limpar período?</span>
                  <button
                    onClick={handleClear}
                    disabled={clearing}
                    className="text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-xs text-ink-400 hover:text-ink-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Limpar
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Filters */}
        <div className="flex gap-3">
          <Select
            label="Período"
            value={period}
            onChange={v => setPeriod(v as PeriodFilter)}
            options={[
              { value: 'all', label: 'Sempre' },
              { value: 'day', label: 'Hoje' },
              { value: 'week', label: 'Esta semana' },
              { value: 'month', label: 'Este mês' },
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={v => setStatus(v as StatusFilter)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'completed', label: 'Concluídos' },
              { value: 'cancelled', label: 'Cancelados' },
            ]}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-ink-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-ink-400">
            <Scissors size={32} className="opacity-40" />
            <p className="text-sm">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-ink-400">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
            <div className="space-y-3">
              {filtered.map(appt => (
                <Card key={appt.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-ink-700">
                        <User size={13} className="text-ink-400 flex-shrink-0" />
                        <span className="font-medium truncate">{appt.profiles?.full_name ?? 'Cliente'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-ink-600">
                        <Scissors size={13} className="text-ink-400 flex-shrink-0" />
                        <span>{appt.services?.name ?? '—'}</span>
                        {appt.services && (
                          <span className="text-ink-400">· {formatCurrency(appt.services.price)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-ink-500">
                        <Calendar size={12} />
                        <span>{formatDate(appt.date)}</span>
                        {appt.services && (
                          <>
                            <Clock size={12} />
                            <span>{appt.services.duration} min</span>
                          </>
                        )}
                      </div>
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
