import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera, Store, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBusinessConfig } from '@/hooks/useBusinessConfig'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AdminIdentity() {
  const { config, updateConfig } = useBusinessConfig()
  const logoRef = useRef<HTMLInputElement>(null)

  const [logoUrl, setLogoUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [address, setAddress] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressState, setAddressState] = useState('')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deletingLogo, setDeletingLogo] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (config) {
      setLogoUrl(config.logo_url ?? '')
      setBusinessName(config.business_name ?? '')
      setAddress(config.address ?? '')
      setAddressNumber(config.address_number ?? '')
      setAddressCity(config.address_city ?? '')
      setAddressState(config.address_state ?? '')
      setInstagram(config.instagram ?? '')
      setWhatsapp(config.whatsapp ?? '')
    }
  }, [config])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB.')
      return
    }
    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      setLogoUrl(url)
      await updateConfig({ logo_url: url })
      toast.success('Logo atualizada!')
    } catch {
      toast.error('Erro ao enviar logo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleDeleteLogo() {
    setDeletingLogo(true)
    try {
      const extensions = ['jpg', 'jpeg', 'png', 'webp']
      await Promise.allSettled(
        extensions.map(ext => supabase.storage.from('logos').remove([`logo.${ext}`]))
      )
      setLogoUrl('')
      await updateConfig({ logo_url: null })
      toast.success('Logo removida.')
    } catch {
      toast.error('Erro ao remover logo.')
    } finally {
      setDeletingLogo(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!businessName.trim()) {
      toast.error('Nome da barbearia é obrigatório.')
      return
    }
    setSaving(true)
    try {
      await updateConfig({
        business_name: businessName.trim(),
        address: address.trim() || null,
        address_number: addressNumber.trim() || null,
        address_city: addressCity.trim() || null,
        address_state: addressState.trim() || null,
        instagram: instagram.trim() || null,
        whatsapp: whatsapp.trim() || null,
      })
      toast.success('Identidade salva!')
    } catch {
      toast.error('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader backTo="/admin" title="Identidade" />

      <main className="max-w-lg mx-auto px-4 py-6 animate-fade-up">
        <form onSubmit={handleSave} className="space-y-5">

          {/* Logo */}
          <Card>
            <CardContent className="pt-5">
              <h2 className="font-display font-bold uppercase tracking-wide text-ink-900 text-sm mb-4">Logo</h2>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  disabled={uploadingLogo || deletingLogo}
                  className="relative group flex-shrink-0"
                >
                  <div className="w-20 h-20 rounded-2xl bg-ink-50 ring-2 ring-brand-400/40 overflow-hidden flex items-center justify-center shadow-soft">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store size={28} className="text-ink-400" />
                    )}
                  </div>
                  {!logoUrl && (
                    <div className="absolute inset-0 rounded-2xl bg-ink-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={18} className="text-cream" />
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 rounded-2xl bg-ink-900/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => logoRef.current?.click()}
                    disabled={uploadingLogo || deletingLogo}
                  >
                    {logoUrl ? 'Trocar logo' : 'Enviar logo'}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteLogo}
                      loading={deletingLogo}
                      disabled={uploadingLogo}
                    >
                      <Trash2 size={14} />
                      Remover logo
                    </Button>
                  )}
                  <p className="text-xs text-ink-400">JPG, PNG ou WebP · máx. 2MB</p>
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
            </CardContent>
          </Card>

          {/* Business details */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <h2 className="font-display font-bold uppercase tracking-wide text-ink-900 text-sm">Dados da barbearia</h2>

              <Input
                label="Nome da barbearia"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Ex: Barbearia do João"
              />

              <div className="space-y-2">
                <Input
                  label="Endereço"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Rua / Avenida"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={addressNumber}
                    onChange={e => setAddressNumber(e.target.value)}
                    placeholder="Número"
                  />
                  <Input
                    value={addressCity}
                    onChange={e => setAddressCity(e.target.value)}
                    placeholder="Cidade"
                  />
                  <Input
                    value={addressState}
                    onChange={e => setAddressState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="UF"
                    maxLength={2}
                    className="uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Instagram"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value.replace('@', ''))}
                  placeholder="handle"
                  icon={<span className="text-sm">@</span>}
                />
                <Input
                  label="WhatsApp"
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="5511999999999"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" variant="accent" loading={saving} className="w-full">
            Salvar identidade
          </Button>
        </form>
      </main>
    </div>
  )
}
