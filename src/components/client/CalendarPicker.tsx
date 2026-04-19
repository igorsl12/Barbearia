import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, format, isBefore, startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarPickerProps {
  selected: Date | null
  onSelect: (date: Date) => void
  workingDays?: number[]
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarPicker({ selected, onSelect, workingDays }: CalendarPickerProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const isPrevDisabled = isSameMonth(currentMonth, today)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          disabled={isPrevDisabled}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-opacity"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <span className="font-semibold text-gray-900 capitalize text-sm">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          type="button"
          onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} className="text-gray-700" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map(day => {
          const inMonth = isSameMonth(day, currentMonth)
          const isSelected = selected ? isSameDay(day, selected) : false
          const isTodayDay = isToday(day)
          const isPast = isBefore(startOfDay(day), startOfDay(today))
          const isWorking = workingDays === undefined || workingDays.includes(day.getDay())
          const disabled = isPast || !isWorking

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && inMonth && onSelect(day)}
              disabled={disabled || !inMonth}
              className={cn(
                'relative mx-auto flex items-center justify-center h-9 w-9 rounded-xl text-sm font-medium transition-all',
                !inMonth && 'invisible pointer-events-none',
                inMonth && disabled && 'text-gray-300 cursor-not-allowed',
                inMonth && !disabled && !isSelected && 'text-gray-700 hover:bg-gray-100',
                isSelected && 'bg-black text-white shadow-sm',
                isTodayDay && !isSelected && !disabled && 'text-black font-bold ring-1 ring-black ring-offset-1',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
