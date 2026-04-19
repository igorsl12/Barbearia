import { useCallback, useState } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/types'

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

  return { appointments, loading, loadMine, loadHistory, loadAllHistory, loadByDate, getConfirmedForDate, bookAppointment, updateStatus, cancelAppointment, clearHistory, clearAllHistory }
}
