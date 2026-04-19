import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Service } from '@/types'

interface ServiceFormProps {
  initial?: Partial<Service>
  onSave: (data: { name: string; duration: number; price: number; id?: string }) => Promise<void>
  onCancel?: () => void
}

export function ServiceForm({ initial, onSave, onCancel }: ServiceFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [duration, setDuration] = useState(String(initial?.duration ?? 30))
  const [price, setPrice] = useState(String(initial?.price ?? ''))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !duration || !price) {
      toast.error('Preencha todos os campos')
      return
    }
    setLoading(true)
    try {
      await onSave({ name: name.trim(), duration: Number(duration), price: Number(price), id: initial?.id })
      toast.success(initial?.id ? 'Serviço atualizado!' : 'Serviço criado!')
      if (!initial?.id) {
        setName('')
        setDuration('30')
        setPrice('')
      }
    } catch {
      toast.error('Erro ao salvar serviço.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        label="Nome do serviço"
        placeholder="Ex: Corte de Cabelo"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <div className="flex gap-3">
        <Input
          label="Duração (min)"
          type="number"
          min={5}
          placeholder="30"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />
        <Input
          label="Preço (R$)"
          type="number"
          min={0}
          step={0.01}
          placeholder="35.00"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial?.id ? 'Salvar alterações' : 'Adicionar serviço'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
