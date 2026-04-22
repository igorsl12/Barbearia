import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, User, Scissors, ChevronLeft, CalendarCheck, History, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useServices } from '@/hooks/useServices'
import { useAppointments } from '@/hooks/useAppointments'
import { useBusinessConfig } from '@/hooks/useBusinessConfig'
import { ServiceCard } from '@/components/client/ServiceCard'
import { CalendarPicker } from '@/components/client/CalendarPicker'
import { TimeSlotGrid } from '@/components/client/TimeSlotGrid'
import { AppointmentList } from '@/components/client/AppointmentList'
import { Button } from '@/components/ui/button'
import { generateTimeSlots, formatDate, formatCurrency } from '@/lib/utils'
import type { BookingStep, Service } from '@/types'

export function ClientDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { services, loading: servicesLoading } = useServices()
  const { appointments, loading: apptsLoading, loadMine, getConfirmedForDate, bookAppointment, cancelAppointment } = useAppointments()
  const { config } = useBusinessConfig()

  const [view, setView] = useState<'appointments' | 'booking'>('appointments')
  const [step, setStep] = useState<BookingStep>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [confirmedSlots, setConfirmedSlots] = useState<Array<{ date: string; services: { duration: number } }>>([])
  const [booking, setBooking] = useState(false)

  useEffect(() => { if (user) loadMine() }, [loadMine, user])

  async function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
    if (config) {
      const generated = generateTimeSlots(config, date)
      setSlots(generated)
      const confirmed = await getConfirmedForDate(date)
      setConfirmedSlots(confirmed)
    }
    setStep('time')
  }

  async function handleConfirm() {
    if (!profile || !selectedService || !selectedSlot) return
    setBooking(true)
    try {
      await bookAppointment(profile.id, selectedService.id, selectedSlot, config?.auto_confirm ?? false)
      toast.success('Agendamento solicitado! Aguarde a confirmação.')
      setView('appointments')
      setStep('service')
      setSelectedService(null)
      setSelectedDate(null)
      setSelectedSlot(null)
    } catch {
      toast.error('Erro ao agendar. Horário pode ter sido ocupado.')
    } finally {
      setBooking(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelAppointment(id)
      toast.success('Agendamento cancelado.')
    } catch {
      toast.error('Erro ao cancelar.')
    }
  }

  async function handleSignOut() {
    await signOut()
  }

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view === 'booking' ? (
              <>
                <button
                  onClick={() => { setView('appointments'); setStep('service') }}
                  className="mr-1 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-semibold text-gray-900">Novo agendamento</span>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                {config?.logo_url && (
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={config.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 leading-none">{config?.business_name ?? 'Barbearia'}</p>
                  <p className="font-semibold text-gray-900 leading-tight">
                    {firstName ? `Olá, ${firstName} 👋` : 'Bem-vindo!'}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link to="/history" className="p-2 hover:bg-gray-100 rounded-lg">
                  <History size={18} className="text-gray-600" />
                </Link>
                <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg">
                  <User size={18} className="text-gray-600" />
                </Link>
                <button onClick={handleSignOut} className="p-2 hover:bg-gray-100 rounded-lg">
                  <LogOut size={18} className="text-gray-600" />
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {view === 'appointments' && (
          <>
            <Button
              onClick={() => {
                if (!user) { navigate('/login'); return }
                setView('booking'); setStep('service')
              }}
              className="w-full"
            >
              <Scissors size={16} />
              Agendar novo horário
            </Button>

            {/* Barber info */}
            {config?.address && (
              <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Onde nos encontrar</p>
                  <p className="text-xs text-gray-600">
                    {[
                      config.address,
                      config.address_number,
                      config.address_city && config.address_state
                        ? `${config.address_city}/${config.address_state}`
                        : config.address_city || config.address_state,
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {user && (
              <section>
                <h2 className="text-base font-semibold text-gray-900 mb-3">Meus agendamentos</h2>
                <AppointmentList
                  appointments={appointments}
                  loading={apptsLoading}
                  onCancel={handleCancel}
                />
              </section>
            )}
          </>
        )}

        {view === 'booking' && (
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {(['service', 'date', 'time', 'confirm'] as BookingStep[]).map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`flex-1 h-1 rounded-full transition-colors ${
                    ['service', 'date', 'time', 'confirm'].indexOf(step) >= i
                      ? 'bg-black'
                      : 'bg-gray-200'
                  }`} />
                </div>
              ))}
            </div>

            {/* Step: Service */}
            {step === 'service' && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Escolha o serviço</h2>
                  <p className="text-sm text-gray-500">Selecione o que deseja fazer hoje.</p>
                </div>
                {servicesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {services.map(s => (
                      <ServiceCard
                        key={s.id}
                        service={s}
                        selected={selectedService?.id === s.id}
                        onClick={() => setSelectedService(s)}
                      />
                    ))}
                  </div>
                )}
                {selectedService && (
                  <Button onClick={() => setStep('date')} className="w-full">
                    Continuar
                  </Button>
                )}
              </section>
            )}

            {/* Step: Date */}
            {step === 'date' && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Escolha a data</h2>
                  <p className="text-sm text-gray-500">Selecione o dia do atendimento.</p>
                </div>
                <CalendarPicker
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  workingDays={config?.working_days ?? [1,2,3,4,5,6]}
                />
                <button onClick={() => setStep('service')} className="text-sm text-gray-500 hover:text-black">
                  ← Trocar serviço
                </button>
              </section>
            )}

            {/* Step: Time */}
            {step === 'time' && selectedDate && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Escolha o horário</h2>
                  <p className="text-sm text-gray-500">
                    Horários disponíveis para {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                {config && selectedService ? (
                  <TimeSlotGrid
                    slots={slots}
                    confirmed={confirmedSlots}
                    serviceDuration={selectedService.duration}
                    config={config}
                    selected={selectedSlot}
                    onSelect={setSelectedSlot}
                  />
                ) : (
                  <p className="text-sm text-gray-400">Carregando horários...</p>
                )}
                {selectedSlot && (
                  <Button onClick={() => setStep('confirm')} className="w-full">
                    Confirmar horário
                  </Button>
                )}
                <button onClick={() => setStep('date')} className="text-sm text-gray-500 hover:text-black">
                  ← Trocar data
                </button>
              </section>
            )}

            {/* Step: Confirm */}
            {step === 'confirm' && selectedService && selectedSlot && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Confirmar agendamento</h2>
                  <p className="text-sm text-gray-500">Revise os detalhes antes de confirmar.</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Serviço</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Data e hora</span>
                    <span className="font-medium">{formatDate(selectedSlot)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Duração</span>
                    <span className="font-medium">{selectedService.duration} min</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                    <span className="text-gray-900 font-semibold">Total</span>
                    <span className="font-bold text-gray-900">{formatCurrency(selectedService.price)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleConfirm} loading={booking} className="w-full">
                    <CalendarCheck size={16} />
                    Confirmar agendamento
                  </Button>
                  <Button variant="ghost" onClick={() => setStep('time')}>
                    Voltar
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* WhatsApp floating button */}
      {config?.whatsapp && (
        <a
          href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-20"
          aria-label="WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  )
}
