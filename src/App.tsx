import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Login } from '@/pages/Login'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ClientDashboard } from '@/pages/client/Dashboard'
import { ClientHistory } from '@/pages/client/History'
import { ClientProfile } from '@/pages/client/Profile'
import { AdminDashboard } from '@/pages/admin/Dashboard'
import { AdminSettings } from '@/pages/admin/Settings'
import { AdminHistory } from '@/pages/admin/History'
import { AdminIdentity } from '@/pages/admin/Identity'
import type { ReactNode } from 'react'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading, profileLoading } = useAuth()
  if (loading || profileLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, profileLoading } = useAuth()
  if (loading || profileLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user, profile, loading, profileLoading } = useAuth()
  if (loading || profileLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/dashboard" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Carregando...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<ClientDashboard />} />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ClientProfile />
          </PrivateRoute>
        }
      />
      <Route
        path="/history"
        element={
          <PrivateRoute>
            <ClientHistory />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/history"
        element={
          <AdminRoute>
            <AdminHistory />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminSettings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/identity"
        element={
          <AdminRoute>
            <AdminIdentity />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
