import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean        // verificação inicial de sessão
  profileLoading: boolean // busca de perfil após auth change
  signIn: (email: string, password: string) => Promise<'admin' | 'client'>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  sendOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  updateProfile: (updates: { full_name?: string; phone?: string; avatar_url?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Busca o perfil; se não existir, cria um (rede de segurança caso
  // o trigger do banco não tenha rodado — comum no login com Google).
  const ensureProfile = useCallback(async (authUser: User): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
    if (data) return data

    // Perfil ausente → cria a partir dos metadados do usuário.
    const meta = authUser.user_metadata ?? {}
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: meta.full_name ?? meta.name ?? (authUser.email?.split('@')[0] ?? ''),
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
        role: 'client',
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Erro ao criar perfil:', insertError)
      return null
    }
    return created
  }, [])

  const fetchProfile = useCallback(async (authUser: User) => {
    setProfileLoading(true)
    const profileData = await ensureProfile(authUser)
    setProfile(profileData)
    setProfileLoading(false)
  }, [ensureProfile])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Mantém a sessão e garante o perfil (cria se faltar).
        setUser(session.user)
        const profileData = await ensureProfile(session.user)
        setProfile(profileData)
      }
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return

      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, ensureProfile])

  async function signIn(email: string, password: string): Promise<'admin' | 'client'> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      const profileData = await ensureProfile(data.user)
      if (!profileData) {
        throw new Error('Não foi possível carregar seu perfil. Tente novamente.')
      }
      setUser(data.user)
      setProfile(profileData)
      return profileData.role as 'admin' | 'client'
    }
    return 'client'
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    if (error) throw error
  }

  async function verifyOtp(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) throw error
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  async function updateProfile(updates: { full_name?: string; phone?: string; avatar_url?: string }) {
    if (!user) throw new Error('Não autenticado')
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) throw error
    setProfile(prev => prev ? { ...prev, ...updates } : prev)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, profileLoading, signIn, signInWithGoogle, signUp, signOut, sendOtp, verifyOtp, updatePassword, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
