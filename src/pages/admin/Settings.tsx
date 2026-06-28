import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Power, Trash2, ChevronDown } from 'lucide-react'
import { useServices } from '@/hooks/useServices'
import { useBusinessConfig } from '@/hooks/useBusinessConfig'
import { ServiceForm } from '@/components/admin/ServiceForm'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDuration } from '@/lib/utils'
import type { Service } from '@/types'

const WEEK_DAYS = [
  { value: 1, short: 'Seg', long: 'Segunda' },
  { value: 2, short: 'Ter', long: 'Terça' },
  { value: 3, short: 'Qua', long: 'Quarta' },
  { value: 4, short: 'Qui', long: 'Quinta' },
  { value: 5, short: 'Sex', long: 'Sexta' },
  { value: 6, short: 'Sáb', long: 'Sábado' },
  { value: 0, short: 'Dom', long: 'Domingo' },
]

export function AdminSettings() {
  const { services, loading: svLoading, upsertService, toggleActive, deleteService, loadAll } = useServices()
  const { config, updateConfig } = useBusinessConfig()
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Schedule
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6])
  const [dayHours, setDayHours] = useState<Record<number, { open: string; close: string }>>({})
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [slotInterval, setSlotInterval] = useState(30)
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [lunchEnabled, setLunchEnabled] = useState(false)
  const [lunchStart, setLunchStart] = useState('12:00')
  const [lunchEnd, setLunchEnd] = useState('13:00')
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (config) {
      const days = config.working_days ?? [1, 2, 3, 4, 5, 6]
      setWorkingDays(days)
      setSelectedDay(days[0] ?? 1)
      setSlotInterval(config.slot_interval ?? 30)
      setAutoConfirm(config.auto_confirm ?? false)
      setLunchEnabled(!!(config.lunch_start && config.lunch_end))
      setLunchStart(config.lunch_start ?? '12:00')
      setLunchEnd(config.lunch_end ?? '13:00')
      const defaultOpen  = config.opening_time?.slice(0, 5) ?? '09:00'
      const defaultClose = config.closing_time?.slice(0, 5) ?? '18:00'
      const hours: Record<number, { open: string; close: string }> = {}
      days.forEach(d => {
        const saved = config.day_hours?.[String(d)]
        hours[d] = { open: saved?.open ?? defaultOpen, close: saved?.close ?? defaultClose }
      })
      setDayHours(hours)
    }
  }, [config])

  function toggleDay(day: number) {
    setWorkingDays(prev => {
      const removing = prev.includes(day)
      const next = removing ? prev.filter(d => d !== day) : [...prev, day]
      if (!removing) {
        setDayHours(h => ({ ...h, [day]: h[day] ?? { open: '09:00', close: '18:00' } }))
        setSelectedDay(day)
      } else if (selectedDay === day) {
        setSelectedDay(next[0] ?? 1)
      }
      return next
    })
  }

  function setHour(day: number, field: 'open' | 'close', value: string) {
    setDayHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault()
    if (workingDays.length === 0) {
      toast.error('Selecione ao menos um dia de atendimento.')
      return
    }
    const invalid = workingDays.find(d => {
      const h = dayHours[d]
      return h && h.open >= h.close
    })
    if (invalid !== undefined) {
      const name = WEEK_DAYS.find(d => d.value === invalid)?.long
      toast.error(`Horário inválido em ${name}: abertura deve ser antes do fechamento.`)
      return
    }
    setSavingConfig(true)
    try {
      const dayHoursRecord: Record<string, { open: string; close: string }> = {}
      workingDays.forEach(d => { if (dayHours[d]) dayHoursRecord[String(d)] = dayHours[d] })
      const firstDay = dayHours[workingDays[0]]
      await updateConfig({
        opening_time: firstDay?.open ?? '09:00',
        closing_time: firstDay?.close ?? '18:00',
        slot_interval: slotInterval,
        auto_confirm: autoConfirm,
        lunch_start: lunchEnabled ? lunchStart : null,
        lunch_end: lunchEnabled ? lunchEnd : null,
        working_days: workingDays,
        day_hours: dayHoursRecord,
      })
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSavingConfig(false)
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      await toggleActive(id, !active)
      toast.success(active ? 'Serviço desativado.' : 'Serviço ativado!')
    } catch {
      toast.error('Erro ao atualizar serviço.')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteService(id)
      toast.success('Serviço excluído.')
      setConfirmDeleteId(null)
      if (editingService?.id === id) setEditingService(null)
    } catch {
      toast.error('Erro ao excluir serviço.')
    }
  }

  const timeInputClass = 'flex-1 bg-white border border-ink-200 rounded-xl px-3.5 h-11 text-sm text-ink-900 transition-all focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400'

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader backTo="/admin" title="Configurações" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-up">

        {/* Schedule */}
        <section>
          <h2 className="font-display font-bold uppercase tracking-wide text-ink-900 text-lg mb-3">Agenda de atendimento</h2>
          <Card>
            <CardContent className="pt-5">
              <form onSubmit={handleSaveConfig} className="space-y-6">

                {/* Working days */}
                <div>
                  <p className="text-sm font-medium text-ink-700 mb-3">Dias de atendimento</p>
                  <div className="flex gap-2 flex-wrap">
                    {WEEK_DAYS.map(day => {
                      const active = workingDays.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all select-none ${
                            active
                              ? 'bg-ink-900 border-ink-900 text-cream shadow-soft'
                              : 'bg-white border-ink-200 text-ink-500 hover:border-ink-400'
                          }`}
                        >
                          {day.short}
                        </button>
                      )
                    })}
                  </div>
                  {workingDays.length > 0 && (
                    <p className="text-xs text-ink-400 mt-2">
                      {workingDays.length} dia{workingDays.length !== 1 ? 's' : ''} selecionado{workingDays.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Per-day hours */}
                {workingDays.length > 0 && (() => {
                  const hours = dayHours[selectedDay] ?? { open: '09:00', close: '18:00' }
                  const invalid = hours.open >= hours.close
                  return (
                    <div>
                      <p className="text-sm font-medium text-ink-700 mb-3">Horário por dia</p>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-1.5">Dia</p>
                          <div className="relative">
                            <select
                              value={selectedDay}
                              onChange={e => setSelectedDay(Number(e.target.value))}
                              className="w-full appearance-none bg-white border border-ink-200 rounded-xl px-3.5 h-11 text-sm text-ink-900 transition-all focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-400 cursor-pointer pr-9"
                            >
                              {WEEK_DAYS.filter(d => workingDays.includes(d.value)).map(d => (
                                <option key={d.value} value={d.value}>{d.long}</option>
                              ))}
                            </select>
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-ink-400 font-medium uppercase tracking-wide mb-1.5">Horário</p>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={hours.open}
                              onChange={e => setHour(selectedDay, 'open', e.target.value)}
                              className={timeInputClass}
                            />
                            <span className="text-xs text-ink-400 flex-shrink-0">às</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={e => setHour(selectedDay, 'close', e.target.value)}
                              className={`${timeInputClass} ${invalid ? 'border-red-400 bg-red-50' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Slot interval */}
                <div>
                  <p className="text-sm font-medium text-ink-700 mb-3">Intervalo entre horários</p>
                  <div className="flex gap-2">
                    {[15, 20, 30, 45, 60].map(min => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setSlotInterval(min)}
                        className={`flex-1 h-11 rounded-xl border-2 text-sm font-semibold transition-all ${
                          slotInterval === min
                            ? 'bg-ink-900 border-ink-900 text-cream shadow-soft'
                            : 'bg-white border-ink-200 text-ink-600 hover:border-ink-400'
                        }`}
                      >
                        {min}min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lunch break */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm font-medium text-ink-700">Pausa para almoço</p>
                      <p className="text-xs text-ink-400">Bloqueia horários durante a pausa</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLunchEnabled(v => !v)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${lunchEnabled ? 'bg-brand-400' : 'bg-ink-200'}`}
                      aria-pressed={lunchEnabled}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${lunchEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  {lunchEnabled && (
                    <div className="flex items-center gap-2 pl-1">
                      <input
                        type="time"
                        value={lunchStart}
                        onChange={e => setLunchStart(e.target.value)}
                        className={timeInputClass}
                      />
                      <span className="text-xs text-ink-400 flex-shrink-0">às</span>
                      <input
                        type="time"
                        value={lunchEnd}
                        onChange={e => setLunchEnd(e.target.value)}
                        className={`${timeInputClass} ${lunchEnd <= lunchStart ? 'border-red-400 bg-red-50' : ''}`}
                      />
                    </div>
                  )}
                </div>

                {/* Auto-confirm */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-ink-700">Confirmar automaticamente</p>
                    <p className="text-xs text-ink-400">Agendamentos são confirmados sem revisão</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoConfirm(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${autoConfirm ? 'bg-brand-400' : 'bg-ink-200'}`}
                    aria-pressed={autoConfirm}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoConfirm ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <Button type="submit" variant="accent" loading={savingConfig} className="w-full">
                  Salvar configurações
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Services */}
        <section>
          <h2 className="font-display font-bold uppercase tracking-wide text-ink-900 text-lg mb-3">Serviços</h2>

          <Card className="mb-3">
            <CardContent className="pt-5">
              <h3 className="text-sm font-medium text-ink-700 mb-3">
                {editingService ? 'Editar serviço' : 'Adicionar serviço'}
              </h3>
              <ServiceForm
                initial={editingService ?? undefined}
                onSave={async data => { await upsertService(data); setEditingService(null) }}
                onCancel={editingService ? () => setEditingService(null) : undefined}
              />
            </CardContent>
          </Card>

          {svLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-ink-100 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map(s => (
                <Card key={s.id} className={`p-4 ${!s.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink-900">{s.name}</p>
                      <p className="text-xs text-ink-500">{formatDuration(s.duration)} · {formatCurrency(s.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {confirmDeleteId === s.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-500">Excluir?</span>
                          <button onClick={() => handleDelete(s.id)} className="text-xs font-semibold text-red-600 hover:text-red-700">
                            Sim
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-ink-400 hover:text-ink-600">
                            Não
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingService(s)}
                            className="text-xs font-semibold text-ink-500 hover:text-ink-900 px-2 py-1 rounded-lg hover:bg-ink-100 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(s.id, s.active)}
                            className={`p-1.5 rounded-lg transition-colors ${s.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-ink-400 hover:bg-ink-100'}`}
                            title={s.active ? 'Desativar' : 'Ativar'}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(s.id)}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
