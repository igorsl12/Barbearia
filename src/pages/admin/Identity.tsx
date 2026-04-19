import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Camera, Store, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useBusinessConfig } from '@/hooks/useBusinessConfig'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/admin" className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-semibold text-gray-900">Identidade</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Card className="p-5">
          <form onSubmit={handleSave} className="space-y-5">

            {/* Logo */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Logo</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  disabled={uploadingLogo || deletingLogo}
                  className="relative group flex-shrink-0"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store size={28} className="text-gray-400" />
                    )}
                  </div>
                  {!logoUrl && (
                    <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={18} className="text-white" />
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    disabled={uploadingLogo || deletingLogo}
                    className="text-sm font-medium text-gray-700 hover:text-black px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {logoUrl ? 'Trocar logo' : 'Enviar logo'}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      disabled={deletingLogo || uploadingLogo}
                      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingLogo
                        ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={14} />
                      }
                      Remover logo
                    </button>
                  )}
                  <p className="text-xs text-gray-400">JPG, PNG ou WebP · máx. 2MB</p>
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
            </div>

            <div className="border-t border-gray-100" />

            {/* Business name */}
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">
                Nome da barbearia
              </label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Ex: Barbearia do João"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block">
                Endereço
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Rua / Avenida"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={addressNumber}
                  onChange={e => setAddressNumber(e.target.value)}
                  placeholder="Número"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="text"
                  value={addressCity}
                  onChange={e => setAddressCity(e.target.value)}
                  placeholder="Cidade"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="text"
                  value={addressState}
                  onChange={e => setAddressState(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="UF"
                  maxLength={2}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-black uppercase"
                />
              </div>
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">
                  Instagram
                </label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-black">
                  <span className="pl-3 text-sm text-gray-400 select-none">@</span>
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value.replace('@', ''))}
                    placeholder="handle"
                    className="flex-1 px-2 py-2.5 text-sm text-gray-700 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5 block">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="5511999999999"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <Button type="submit" loading={saving} className="w-full">
              Salvar identidade
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
