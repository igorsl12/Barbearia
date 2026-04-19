import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/types'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name')
    setServices(data ?? [])
    setLoading(false)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('services').select('*').order('name')
    setServices(data ?? [])
    setLoading(false)
  }, [])

  async function upsertService(service: Partial<Service> & { name: string; duration: number; price: number }) {
    if (service.id) {
      const { error } = await supabase.from('services').update(service).eq('id', service.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('services').insert(service)
      if (error) throw error
    }
    await loadAll()
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from('services').update({ active }).eq('id', id)
    if (error) throw error
    await loadAll()
  }

  async function deleteService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
    await loadAll()
  }

  useEffect(() => { load() }, [load])

  return { services, loading, load, loadAll, upsertService, toggleActive, deleteService }
}
