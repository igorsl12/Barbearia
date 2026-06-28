import { format, parseISO, addMinutes, isBefore } from 'date-fns'
import { cn } from '@/lib/utils'
import type { BusinessConfig } from '@/types'

interface TimeSlotGridProps {
  slots: string[]
  confirmed: Array<{ date: string; services: { duration: number } }>
  serviceDuration: number
  config: BusinessConfig
  selected: string | null
  onSelect: (slot: string) => void
}

export function TimeSlotGrid({ slots, confirmed, serviceDuration, selected, onSelect }: TimeSlotGridProps) {
  function isUnavailable(slotIso: string) {
    const slotStart = parseISO(slotIso)
    const slotEnd = addMinutes(slotStart, serviceDuration)

    if (isBefore(slotStart, new Date())) return true

    return confirmed.some(({ date, services }) => {
      const apptStart = parseISO(date)
      const apptEnd = addMinutes(apptStart, services.duration)
      return slotStart < apptEnd && slotEnd > apptStart
    })
  }

  if (slots.length === 0) {
    return (
      <p className="text-center text-sm text-ink-400 py-8">
        Nenhum horário disponível para esta data.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map(slot => {
        const unavailable = isUnavailable(slot)
        const isSelected = selected === slot

        return (
          <button
            key={slot}
            disabled={unavailable}
            onClick={() => onSelect(slot)}
            className={cn(
              'h-11 rounded-xl border text-sm font-semibold transition-all duration-200',
              isSelected
                ? 'bg-ink-900 text-cream border-ink-900 shadow-soft'
                : unavailable
                ? 'bg-ink-50 text-ink-300 border-ink-100 cursor-not-allowed line-through'
                : 'bg-white text-ink-700 border-ink-200 hover:border-brand-400 hover:text-brand-700',
            )}
          >
            {format(parseISO(slot), 'HH:mm')}
          </button>
        )
      })}
    </div>
  )
}
