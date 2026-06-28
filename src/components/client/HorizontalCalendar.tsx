import { addDays, format, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface HorizontalCalendarProps {
  selected: Date | null
  onSelect: (date: Date) => void
  daysAhead?: number
  workingDays?: number[]
}

export function HorizontalCalendar({ selected, onSelect, daysAhead = 30, workingDays }: HorizontalCalendarProps) {
  const today = new Date()
  const days = Array.from({ length: daysAhead }, (_, i) => addDays(today, i))

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1">
      {days.map(day => {
        const isSelected = selected ? isSameDay(day, selected) : false
        const todayDay = isToday(day)
        const disabled = workingDays !== undefined && !workingDays.includes(day.getDay())

        return (
          <button
            key={day.toISOString()}
            onClick={() => !disabled && onSelect(day)}
            disabled={disabled}
            className={cn(
              'flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-all',
              disabled
                ? 'bg-ink-50 border-ink-100 text-ink-300 cursor-not-allowed'
                : isSelected
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white border-ink-200 text-ink-700 hover:border-ink-400',
            )}
          >
            <span className={cn(
              'text-xs font-medium uppercase',
              disabled ? 'text-ink-300' : isSelected ? 'text-white/70' : 'text-ink-400'
            )}>
              {format(day, 'EEE', { locale: ptBR })}
            </span>
            <span className="text-lg font-bold leading-tight">{format(day, 'd')}</span>
            {todayDay && !isSelected && !disabled && (
              <span className="w-1 h-1 rounded-full bg-ink-900 mt-0.5" />
            )}
          </button>
        )
      })}
    </div>
  )
}
