import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, Settings, ChevronLeft, ChevronRight, Scissors, History, Palette } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { useAppointments } from '@/hooks/useAppointments'
import { useBusinessConfig } from '@/hooks/useBusinessConfig'
import { AppointmentCard } from '@/components/admin/AppointmentCard'
import { StatsOverview } from '@/components/admin/StatsOverview'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import type { Appointment, AppointmentStats } from '@/types'

export function AdminDashboard() {
  const { signOut } = useAuth()
  const { appointments, loading, loadByDate, loadStats, updateStatus } = useAppointments()
  const { config } = useBusinessConfig()
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

  const headerActions = (
    <>
      {pendingCount > 0 && (
        <Badge variant="pending" className="mr-0.5">{pendingCount}</Badge>
      )}
      <Link to="/admin/history" className="p-2 hover:bg-ink-100 rounded-lg transition-colors" aria-label="Histórico">
        <History size={18} className="text-ink-600" />
      </Link>
      <Link to="/admin/identity" className="p-2 hover:bg-ink-100 rounded-lg transition-colors" aria-label="Identidade">
        <Palette size={18} className="text-ink-600" />
      </Link>
      <Link to="/admin/settings" className="p-2 hover:bg-ink-100 rounded-lg transition-colors" aria-label="Configurações">
        <Settings size={18} className="text-ink-600" />
      </Link>
      <button onClick={signOut} className="p-2 hover:bg-ink-100 rounded-lg transition-colors" aria-label="Sair">
        <LogOut size={18} className="text-ink-600" />
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader
        showLogo
        logo={config?.logo_url}
        eyebrow="Painel admin"
        title={config?.business_name ?? 'Agenda'}
        actions={headerActions}
      />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 animate-fade-up">
        {/* Stats overview */}
        <StatsOverview stats={stats} loading={statsLoading} />

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-white border border-ink-100 rounded-2xl p-3 shadow-soft">
          <button
            onClick={() => setDate(d => subDays(d, 1))}
            className="p-1.5 hover:bg-ink-100 rounded-lg text-ink-600 transition-colors"
            aria-label="Dia anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="font-display font-bold uppercase tracking-wide text-ink-900 capitalize leading-tight">{dateLabel}</p>
            <p className="text-xs text-ink-400">{format(date, 'dd/MM/yyyy')}</p>
          </div>
          <button
            onClick={() => setDate(d => addDays(d, 1))}
            className="p-1.5 hover:bg-ink-100 rounded-lg text-ink-600 transition-colors"
            aria-label="Próximo dia"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Appointments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold uppercase tracking-wide text-ink-900 text-lg">
              Agendamentos{' '}
              {appointments.length > 0 && (
                <span className="text-ink-400 font-normal">({appointments.length})</span>
              )}
            </h2>
            {!isToday(date) && (
              <button
                onClick={() => setDate(new Date())}
                className="text-xs font-semibold text-ink-500 hover:text-brand-600 transition-colors"
              >
                Ir para hoje
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-ink-100 animate-pulse rounded-2xl" />
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
