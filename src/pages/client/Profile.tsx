import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'

export function ClientProfile() {
  const { profile, updateProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB.')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatar_${profile.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      setAvatarUrl(url)
      await updateProfile({ avatar_url: url })
      toast.success('Foto atualizada!')
    } catch {
      toast.error('Erro ao enviar foto.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Nome é obrigatório.')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() || undefined })
      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Meu perfil" backTo="/dashboard" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 animate-fade-up">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative group"
          >
            <div className="w-28 h-28 rounded-full bg-ink-100 ring-4 ring-white shadow-card overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-ink-400" />
              )}
            </div>
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-400 text-ink-950 shadow-glow ring-2 ring-cream">
              <Camera size={15} />
            </span>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-ink-900/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <p className="text-xs text-ink-400">Toque para alterar a foto · máx. 2MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Form */}
        <Card className="p-5">
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Nome completo"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
            <div>
              <Input label="E-mail" type="email" value={profile?.email ?? ''} disabled />
              <p className="text-xs text-ink-400 mt-1">O e-mail não pode ser alterado.</p>
            </div>
            <Input
              label="Telefone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
            <Button type="submit" variant="accent" loading={saving} className="w-full">
              Salvar alterações
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
