import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, Settings, ChevronLeft, ChevronRight, Scissors, History, Palette } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { useAppointments } from '@/hooks/useAppointments'
import { AppointmentCard } from '@/components/admin/AppointmentCard'
import { StatsOverview } from '@/components/admin/StatsOverview'
import type { Appointment, AppointmentStats } from '@/types'

export function AdminDashboard() {
  const { signOut } = useAuth()
  const { appointments, loading, loadByDate, loadStats, updateStatus } = useAppointments()
  const [date, setDate] = useState(new Date())
  const [stats, setStats] = useState<AppointmentStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const refreshStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      setStats(await loadStats())
    } finally {
      setStatsLoading(false)
    }
  }, [loadStats])

  useEffect(() => { loadByDate(date) }, [date, loadByDate])
  useEffect(() => { refreshStats() }, [refreshStats])

  async function handleStatus(id: string, status: Appointment['status']) {
    try {
      await updateStatus(id, status)
      await loadByDate(date)
      await refreshStats()
      const msgs: Record<string, string> = {
        confirmed: 'Agendamento confirmado!',
        cancelled: 'Agendamento recusado.',
        completed: 'Marcado como concluído!',
      }
      toast.success(msgs[status])
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  const dateLabel = isToday(date)
    ? 'Hoje'
    : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })

  const pendingCount = appointments.filter(a => a.status === 'pending').length

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-ink-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ink-900 rounded-lg flex items-center justify-center">
              <Scissors size={14} className="text-brand-400" />
            </div>
            <span className="font-display text-lg uppercase tracking-wide text-ink-900">Painel Admin</span>
            {pendingCount > 0 && (
              <span className="bg-brand-400 text-ink-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link to="/admin/history" className="p-2 hover:bg-ink-50 rounded-lg">
              <History size={18} className="text-ink-600" />
            </Link>
            <Link to="/admin/identity" className="p-2 hover:bg-ink-50 rounded-lg">
              <Palette size={18} className="text-ink-600" />
            </Link>
            <Link to="/admin/settings" className="p-2 hover:bg-ink-50 rounded-lg">
              <Settings size={18} className="text-ink-600" />
            </Link>
            <button onClick={signOut} className="p-2 hover:bg-ink-50 rounded-lg">
              <LogOut size={18} className="text-ink-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Stats overview */}
        <StatsOverview stats={stats} loading={statsLoading} />

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-white border border-ink-100 rounded-xl p-3">
          <button
            onClick={() => setDate(d => subDays(d, 1))}
            className="p-1.5 hover:bg-ink-50 rounded-lg"
          >
            <ChevronLeft size={18} className="text-ink-600" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink-900 capitalize">{dateLabel}</p>
            <p className="text-xs text-ink-400">{format(date, 'dd/MM/yyyy')}</p>
          </div>
          <button
            onClick={() => setDate(d => addDays(d, 1))}
            className="p-1.5 hover:bg-ink-50 rounded-lg"
          >
            <ChevronRight size={18} className="text-ink-600" />
          </button>
        </div>

        {/* Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg uppercase tracking-wide text-ink-900">
              Agendamentos{' '}
              {appointments.length > 0 && (
                <span className="text-ink-400 font-normal">({appointments.length})</span>
              )}
            </h2>
            {!isToday(date) && (
              <button
                onClick={() => setDate(new Date())}
                className="text-xs text-ink-500 hover:text-brand-600"
              >
                Ir para hoje
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-ink-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-ink-400">
              <Scissors size={32} className="opacity-40" />
              <p className="text-sm">Nenhum agendamento para este dia.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onConfirm={id => handleStatus(id, 'confirmed')}
                  onReject={id => handleStatus(id, 'cancelled')}
                  onComplete={id => handleStatus(id, 'completed')}
                  onCancel={id => handleStatus(id, 'cancelled')}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
