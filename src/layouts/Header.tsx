import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, Search, User, Wifi, WifiOff, Radio, Moon, Sun, LogOut } from 'lucide-react'
import { useHealth } from '@/hooks/useStats'
import { useOcppWs } from '@/lib/OcppWsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLang } from '@/contexts/LangContext'
import { useAuth } from '@/contexts/AuthContext'
import type { WsStatus } from '@/hooks/useOcppWebSocket'



interface HeaderProps {
  onMenuClick: () => void
  sidebarCollapsed: boolean
}

export default function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const { data: health, isError } = useHealth()
  const { status: wsStatus, messages } = useOcppWs()
  const { theme, toggleTheme } = useTheme()
  const { t, lang, toggleLang } = useLang()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const PAGE_TITLES_I18N = {
    '/dashboard':     { title: t.dashboard.title,    subtitle: t.dashboard.subtitle },
    '/charge-points': { title: t.chargePoints.title, subtitle: t.chargePoints.subtitle },
    '/transactions':  { title: t.transactions.title, subtitle: t.transactions.subtitle },
    '/analytics':     { title: t.analytics.title,    subtitle: t.analytics.subtitle },
    '/messages':      { title: t.messages.title,     subtitle: '' },
    '/ai-insights':   { title: t.aiInsights.title,   subtitle: t.aiInsights.subtitle },
    '/settings':      { title: t.settings.title,     subtitle: t.settings.subtitle },
  }

  const pageKey = Object.keys(PAGE_TITLES_I18N).find((k) =>
    location.pathname.startsWith(k)
  ) ?? '/dashboard'
  const page = PAGE_TITLES_I18N[pageKey as keyof typeof PAGE_TITLES_I18N]

  const WS_STATUS_CONFIG: Record<WsStatus, { label: string; color: string; bg: string; pulse: boolean }> = {
    connected: { label: t.header.wsLive, color: '#059669', bg: '#ecfdf5', pulse: true },
    connecting: { label: t.header.wsConnecting, color: '#d97706', bg: '#fffbeb', pulse: true },
    disconnected: { label: t.header.wsOffline, color: '#64748b', bg: '#f1f5f9', pulse: false },
    error: { label: t.header.wsError, color: '#e11d48', bg: '#fff1f2', pulse: false },
  }

  const backendOnline = !isError && !!health
  const wsCfg = WS_STATUS_CONFIG[wsStatus]

  return (
    <header
      className="flex-shrink-0 h-16 flex items-center gap-4 px-6 bg-white border-b border-slate-200"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04)' }}
    >
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 hidden sm:block">
        <h1 className="text-slate-900 font-semibold text-base leading-none">{page.title}</h1>
        <p className="text-slate-400 text-xs mt-0.5">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={15} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder={t.header.search}
            className="pl-9 pr-4 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            style={{ width: '180px' }}
          />
        </div>

        {/* WebSocket status pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-default"
          style={{ background: wsCfg.bg, color: wsCfg.color, border: `1px solid ${wsCfg.color}30` }}
          title={`WebSocket: ${wsStatus}${messages.length > 0 ? ` · ${messages.length} msgs` : ''}`}
        >
          <Radio size={11} className={wsCfg.pulse ? 'animate-pulse' : ''} />
          {wsCfg.label}
          {wsStatus === 'connected' && messages.length > 0 && (
            <span
              className="ml-0.5 px-1 py-0.5 rounded text-[10px] font-bold"
              style={{ background: `${wsCfg.color}20`, color: wsCfg.color }}
            >
              {messages.length}
            </span>
          )}
        </div>

        {/* Backend REST API status pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: backendOnline ? '#ecfdf5' : '#f1f5f9',
            color: backendOnline ? '#065f46' : '#475569',
          }}
        >
          {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {backendOnline ? 'API' : t.header.apiOffline}
        </div>

        {/* Language switcher */}
        <button
          onClick={toggleLang}
          title={lang === 'en' ? 'Passer en Français' : 'Switch to English'}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="text-base leading-none">{lang === 'en' ? '🇬🇧' : '🇫🇷'}</span>
          {lang === 'en' ? 'EN' : 'FR'}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
            >
              <User size={14} color="white" />
            </div>
            <span className="text-sm text-slate-700 font-medium hidden md:block">
              {user?.name || t.header.admin}
            </span>
          </button>

          {profileOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t.header.admin}</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut size={16} />
                  {t.header.logout}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
