import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { BusinessConfig } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatTime(iso: string) {
  return format(parseISO(iso), 'HH:mm', { locale: ptBR })
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function generateTimeSlots(config: BusinessConfig, date: Date): string[] {
  const slots: string[] = []

  const dayKey = String(date.getDay())
  const dayHours = config.day_hours?.[dayKey]
  const openTime  = dayHours?.open  ?? config.opening_time
  const closeTime = dayHours?.close ?? config.closing_time

  const [openH, openM]   = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)

  const start = new Date(date)
  start.setHours(openH, openM, 0, 0)

  const end = new Date(date)
  end.setHours(closeH, closeM, 0, 0)

  let current = start
  while (current < end) {
    slots.push(current.toISOString())
    current = addMinutes(current, config.slot_interval)
  }

  return slots
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Aguardando confirmação',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  }
  return map[status] ?? status
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}
