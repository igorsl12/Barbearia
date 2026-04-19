import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BusinessConfig } from '@/types'

export function useBusinessConfig() {
  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('business_config').select('*').limit(1).single()
    setConfig(data)
    setLoading(false)
  }, [])

  async function updateConfig(updates: Partial<BusinessConfig>) {
    if (!config) return
    const { error } = await supabase
      .from('business_config')
      .update(updates)
      .eq('id', config.id)
    if (error) throw error
    await load()
  }

  useEffect(() => { load() }, [load])

  return { config, loading, updateConfig }
}
