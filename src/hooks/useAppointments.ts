import { useCallback, useState } from 'react'
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { Appointment, AppointmentStats, Service } from '@/types'

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  const loadMine = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('appointments')
      .select('*, services(name, duration, price)')
      .eq('client_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true })
    setAppointments((data as Appointment[]) ?? [])
    setLoading(false)
  }, [])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('appointments')
      .select('*, services(name, duration, price)')
      .eq('client_id', user.id)
      .in('status', ['completed', 'cancelled'])
      .eq('hidden_by_client', false)
      .order('date', { ascending: false })
    setAppointments((data as Appointment[]) ?? [])
    setLoading(false)
  }, [])

  const loadAllHistory = useCallback(async (from?: string, to?: string) => {
    setLoading(true)
    let query = supabase
      .from('appointments')
      .select('*, profiles(full_name, email), services(name, duration, price)')
      .in('status', ['completed', 'cancelled'])
      .eq('hidden_by_admin', false)
      .order('date', { ascending: false })
    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)
    const { data } = await query
    setAppointments((data as Appointment[]) ?? [])
    setLoading(false)
  }, [])

  const loadByDate = useCallback(async (date: Date) => {
    setLoading(true)
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('appointments')
      .select('*, profiles(full_name, email), services(name, duration, price)')
      .gte('date', dayStart.toISOString())
      .lte('date', dayEnd.toISOString())
      .order('date')
    setAppointments((data as Appointment[]) ?? [])
    setLoading(false)
  }, [])

  const loadStats = useCallback(async (): Promise<AppointmentStats> => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const { data } = await supabase
      .from('appointments')
      .select('date, status, services:service_id (name, duration, price)')
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString())

    type StatsRow = Pick<Appointment, 'date' | 'status'> & {
      services: Pick<Service, 'name' | 'price'> | null
    }
    const rows = (data ?? []) as unknown as StatsRow[]

    const empty: AppointmentStats = {
      revenueToday: 0,
      appointmentsToday: 0,
      pendingCount: 0,
      revenueMonth: 0,
      popularService: '—',
    }
    if (rows.length === 0) return empty

    const serviceCounts = new Map<string, number>()
    let popularService = '—'

    const stats = rows.reduce<AppointmentStats>((acc, row) => {
      const date = new Date(row.date)
      const today = isSameDay(date, now)
      const price = row.services?.price ?? 0
      const earns = row.status === 'completed' || row.status === 'confirmed'

      if (earns) acc.revenueMonth += price
      if (today && earns) acc.revenueToday += price
      if (today && row.status !== 'cancelled') acc.appointmentsToday += 1
      if (row.status === 'pending') acc.pendingCount += 1

      if (row.status !== 'cancelled' && row.services?.name) {
        const next = (serviceCounts.get(row.services.name) ?? 0) + 1
        serviceCounts.set(row.services.name, next)
      }

      return acc
    }, { ...empty, popularService: '—' })

    let topCount = 0
    serviceCounts.forEach((count, name) => {
      if (count > topCount) {
        topCount = count
        popularService = name
      }
    })
    stats.popularService = popularService

    return stats
  }, [])

  async function getConfirmedForDate(date: Date) {
    const dayStr = format(date, 'yyyy-MM-dd')
    const { data } = await supabase
      .from('appointments')
      .select('date, services(duration)')
      .in('status', ['confirmed', 'pending'])
      .gte('date', `${dayStr}T00:00:00`)
      .lte('date', `${dayStr}T23:59:59`)
    return (data ?? []) as unknown as Array<{ date: string; services: { duration: number } }>
  }

  async function bookAppointment(clientId: string, serviceId: string, date: string, autoConfirm = false) {
    const { error } = await supabase.from('appointments').insert({
      client_id: clientId,
      service_id: serviceId,
      date,
      status: autoConfirm ? 'confirmed' : 'pending',
    })
    if (error) throw error
    await loadMine()
  }

  async function updateStatus(id: string, status: Appointment['status']) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) throw error
  }

  async function clearHistory() {
    const { error } = await supabase
      .from('appointments')
      .update({ hidden_by_client: true })
      .in('status', ['completed', 'cancelled'])
      .eq('hidden_by_client', false)
    if (error) throw error
    await loadHistory()
  }

  async function clearAllHistory(from?: string, to?: string) {
    let query = supabase
      .from('appointments')
      .update({ hidden_by_admin: true })
      .in('status', ['completed', 'cancelled'])
      .eq('hidden_by_admin', false)
    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)
    const { error } = await query
    if (error) throw error
  }

  async function cancelAppointment(id: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) throw error
    await loadMine()
  }

  async function rescheduleAppointment(id: string, date: string, autoConfirm = false) {
    const { error } = await supabase
      .from('appointments')
      .update({ date, status: autoConfirm ? 'confirmed' : 'pending' })
      .eq('id', id)
    if (error) throw error
    await loadMine()
  }

  return { appointments, loading, loadMine, loadHistory, loadAllHistory, loadByDate, loadStats, getConfirmedForDate, bookAppointment, updateStatus, cancelAppointment, rescheduleAppointment, clearHistory, clearAllHistory }
}
