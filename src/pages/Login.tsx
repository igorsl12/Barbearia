import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessConfig } from '@/hooks/useBusinessConfig'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Tab = 'login' | 'register'

export function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const { config } = useBusinessConfig()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [fullName, setFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validateLogin() {
    const e: Record<string, string> = {}
    if (!email) e.email = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido'
    if (!password) e.password = 'Senha é obrigatória'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateRegister() {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Nome é obrigatório'
    if (!regEmail) e.regEmail = 'E-mail é obrigatório'
    else if (!/\S+@\S+\.\S+/.test(regEmail)) e.regEmail = 'E-mail inválido'
    if (!regPassword) e.regPassword = 'Senha é obrigatória'
    else if (regPassword.length < 6) e.regPassword = 'Mínimo 6 caracteres'
    if (regPassword !== regConfirm) e.regConfirm = 'As senhas não coincidem'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!validateLogin()) return
    setLoading(true)
    try {
      const role = await signIn(email, password)
      toast.success('Login realizado com sucesso!')
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login'
      toast.error(msg.includes('Invalid') ? 'E-mail ou senha incorretos.' : msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validateRegister()) return
    setLoading(true)
    try {
      await signUp(regEmail, regPassword, fullName)
      toast.success('Conta criada! Faça login para continuar.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta'
      if (msg.includes('already')) toast.error('E-mail já cadastrado.')
      else if (msg.includes('rate limit')) toast.error('Muitos cadastros em pouco tempo. Aguarde alguns minutos.')
      else toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-3 overflow-hidden">
            {config?.logo_url ? (
              <img src={config.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl">✂</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {config?.business_name ?? 'Barbearia'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Agendamento online</p>
        </div>

        <Card className="overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}) }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'text-black border-b-2 border-black -mb-px bg-white'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={errors.email}
                  icon={<Mail size={16} />}
                  autoComplete="email"
                />
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  error={errors.password}
                  icon={<Lock size={16} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  autoComplete="current-password"
                />
                <div className="text-right">
                  <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-black underline-offset-2 hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Entrar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Nome completo"
                  placeholder="João Silva"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  error={errors.fullName}
                  icon={<User size={16} />}
                  autoComplete="name"
                />
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="seu@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  error={errors.regEmail}
                  icon={<Mail size={16} />}
                  autoComplete="email"
                />
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  error={errors.regPassword}
                  icon={<Lock size={16} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <Input
                  label="Confirmar senha"
                  type="password"
                  placeholder="Repita a senha"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  error={errors.regConfirm}
                  icon={<Lock size={16} />}
                />
                <Button type="submit" loading={loading} className="w-full">
                  Criar conta
                </Button>
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">ou</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              loading={googleLoading}
              onClick={async () => {
                setGoogleLoading(true)
                try {
                  await signInWithGoogle()
                } catch {
                  toast.error('Erro ao entrar com Google.')
                  setGoogleLoading(false)
                }
              }}
            >
              {!googleLoading && (
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
              )}
              Continuar com Google
            </Button>
          </div>
        </Card>


      </div>
    </div>
  )
}
