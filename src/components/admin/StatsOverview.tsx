import { DollarSign, CalendarCheck, Clock, TrendingUp, Scissors } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { AppointmentStats } from '@/types'

interface StatsOverviewProps {
  stats: AppointmentStats | null
  loading: boolean
}

export function StatsOverview({ stats, loading }: StatsOverviewProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-24 bg-ink-100 animate-pulse rounded-2xl ${i === 1 ? 'col-span-2' : ''}`}
          />
        ))}
      </div>
    )
  }

  const hasPending = stats.pendingCount > 0

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Hero: faturamento do dia */}
      <Card className="col-span-2 bg-ink-900 border-ink-900 shadow-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-brand-400">
              <DollarSign size={15} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Faturamento do dia
              </span>
            </div>
            <p className="mt-2 font-display text-4xl text-cream leading-none">
              {formatCurrency(stats.revenueToday)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-400/15 flex items-center justify-center">
            <TrendingUp size={20} className="text-brand-400" />
          </div>
        </div>
      </Card>

      {/* Agendamentos hoje */}
      <Card className="p-4">
        <div className="flex items-center gap-1.5 text-ink-400">
          <CalendarCheck size={15} className="text-brand-500" />
          <span className="text-xs font-medium">Agendamentos hoje</span>
        </div>
        <p className="mt-2 font-display text-3xl text-ink-900 leading-none">
          {stats.appointmentsToday}
        </p>
      </Card>

      {/* Pendentes */}
      <Card className={`p-4 ${hasPending ? 'border-brand-300 bg-brand-50' : ''}`}>
        <div className={`flex items-center gap-1.5 ${hasPending ? 'text-brand-700' : 'text-ink-400'}`}>
          <Clock size={15} className={hasPending ? 'text-brand-500' : 'text-ink-400'} />
          <span className="text-xs font-medium">Pendentes</span>
        </div>
        <p
          className={`mt-2 font-display text-3xl leading-none ${
            hasPending ? 'text-brand-600' : 'text-ink-900'
          }`}
        >
          {stats.pendingCount}
        </p>
      </Card>

      {/* Faturamento do mês */}
      <Card className="p-4">
        <div className="flex items-center gap-1.5 text-ink-400">
          <DollarSign size={15} className="text-brand-500" />
          <span className="text-xs font-medium">Faturamento do mês</span>
        </div>
        <p className="mt-2 font-display text-2xl text-ink-900 leading-none">
          {formatCurrency(stats.revenueMonth)}
        </p>
      </Card>

      {/* Serviço mais popular */}
      <Card className="p-4">
        <div className="flex items-center gap-1.5 text-ink-400">
          <Scissors size={15} className="text-brand-500" />
          <span className="text-xs font-medium">Mais popular</span>
        </div>
        <p className="mt-2 font-display text-lg text-ink-900 leading-tight truncate">
          {stats.popularService}
        </p>
        <span className="text-xs text-ink-400">no mês</span>
      </Card>
    </div>
  )
}
