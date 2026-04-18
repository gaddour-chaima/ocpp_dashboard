import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ChargePointsPage from '@/pages/ChargePointsPage'
import ChargePointDetailPage from '@/pages/ChargePointDetailPage'
import TransactionsPage from '@/pages/TransactionsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import MessagesPage from '@/pages/MessagesPage'
import AiInsightsPage from '@/pages/AiInsightsPage'
import SettingsPage from '@/pages/SettingsPage'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="charge-points" element={<ChargePointsPage />} />
        <Route path="charge-points/:chargePointId" element={<ChargePointDetailPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="ai-insights" element={<AiInsightsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
