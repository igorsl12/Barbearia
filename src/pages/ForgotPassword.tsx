import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { OTPInput } from '@/components/auth/OTPInput'

type Step = 'email' | 'otp' | 'password' | 'done'

function PasswordRequirements({ password }: { password: string }) {
  const rules = [
    { label: 'Mínimo 6 caracteres', ok: password.length >= 6 },
    { label: 'Pelo menos 1 número', ok: /\d/.test(password) },
    { label: 'Pelo menos 1 letra', ok: /[a-zA-Z]/.test(password) },
  ]
  return (
    <ul className="space-y-1 mt-1">
      {rules.map(r => (
        <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${r.ok ? 'bg-green-500' : 'bg-gray-300'}`} />
          {r.label}
        </li>
      ))}
    </ul>
  )
}

export function ForgotPassword() {
  const { sendOtp, verifyOtp, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { toast.error('Informe seu e-mail'); return }
    setLoading(true)
    try {
      await sendOtp(email)
      toast.success('Código enviado para seu e-mail!')
      setStep('otp')
    } catch {
      toast.error('E-mail não encontrado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 8) { toast.error('Digite o código completo'); return }
    setLoading(true)
    try {
      await verifyOtp(email, otp)
      setStep('password')
    } catch {
      toast.error('Código inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('Senha muito curta'); return }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    setLoading(true)
    try {
      await updatePassword(newPassword)
      setStep('done')
    } catch {
      toast.error('Erro ao atualizar senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-6">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>

        <Card className="p-6">
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recuperar senha</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enviaremos um código de 6 dígitos para o seu e-mail.
                </p>
              </div>
              <Input
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={16} />}
                autoFocus
              />
              <Button type="submit" loading={loading} className="w-full">
                Enviar código
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Digite o código</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Código enviado para <strong>{email}</strong>
                </p>
              </div>
              <OTPInput value={otp} onChange={setOtp} length={8} />
              <Button type="submit" loading={loading} className="w-full" disabled={otp.length < 8}>
                Verificar código
              </Button>
              <button
                type="button"
                onClick={() => { setOtp(''); handleSendOtp(new Event('') as unknown as React.FormEvent) }}
                className="w-full text-xs text-gray-400 hover:text-black"
              >
                Não recebeu? Reenviar
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nova senha</h2>
                <p className="text-sm text-gray-500 mt-1">Escolha uma senha segura.</p>
              </div>
              <div>
                <Input
                  label="Nova senha"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  icon={<Lock size={16} />}
                />
                <PasswordRequirements password={newPassword} />
              </div>
              <Input
                label="Confirmar nova senha"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                icon={<Lock size={16} />}
              />
              <Button type="submit" loading={loading} className="w-full">
                Atualizar senha
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle size={48} className="text-green-500" />
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Senha atualizada!</h2>
                <p className="text-sm text-gray-500 mt-1">Sua senha foi redefinida com sucesso.</p>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full">
                Ir para o login
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
