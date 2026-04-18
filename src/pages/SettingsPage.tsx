import { RefreshCw, Server, Globe, Shield, Bell, Palette, Info, Moon, Sun } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useHealth } from '@/hooks/useStats'
import { formatDateTime } from '@/utils/formatters'
import { useTheme } from '@/contexts/ThemeContext'
import { useLang } from '@/contexts/LangContext'

export default function SettingsPage() {
  const { data: health, isLoading, refetch, dataUpdatedAt } = useHealth()
  const { theme, setTheme } = useTheme()
  const { t, lang, setLang } = useLang()

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000'

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.settings.title}
        subtitle={t.settings.subtitle}
        actions={
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {t.settings.refresh}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="card p-5">
          <SectionTitle icon={<Server size={16} className="text-blue-500" />} title={t.settings.systemHealth} />
          <div className="space-y-3 mt-4">
            <HealthItem label={t.settings.apiStatus} value={health?.status ?? 'Online'} ok={!!health} loading={isLoading} />
            <HealthItem label={t.settings.database} value={health?.database} ok={health?.database === 'connected'} loading={isLoading} />
            <HealthItem label={t.settings.webSocketServer} value={health?.websocket} ok={health?.websocket === 'running'} loading={isLoading} />
            {health?.uptime != null && (
              <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-700">
                <span className="text-sm text-slate-500">{t.settings.uptime}</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m {Math.floor(health.uptime % 60)}s
                </span>
              </div>
            )}
            {health?.version && (
              <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-700">
                <span className="text-sm text-slate-500">{t.settings.backendVersion}</span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{health.version}</span>
              </div>
            )}
            {dataUpdatedAt > 0 && (
              <div className="flex items-center justify-between py-2 border-t border-slate-50 dark:border-slate-700">
                <span className="text-sm text-slate-500">{t.settings.lastChecked}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">{formatDateTime(new Date(dataUpdatedAt).toISOString())}</span>
              </div>
            )}
          </div>
        </div>


        {/* Theme & Language Preferences */}
        <div className="card p-5">
          <SectionTitle icon={<Palette size={16} className="text-violet-500" />} title={t.settings.themePreferences} />
          <div className="space-y-4 mt-4">
            {/* Color Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.settings.colorMode}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.settings.colorModeDesc}</p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setTheme('light')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    theme === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sun size={12} /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Moon size={12} /> Dark
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.settings.language}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.settings.languageDesc}</p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setLang('en')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    lang === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  onClick={() => setLang('fr')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    lang === 'fr' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🇫🇷 Français
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">{t.settings.themeSaved}</p>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card p-5">
          <SectionTitle icon={<Bell size={16} className="text-amber-500" />} title={t.settings.notifications} />
          <div className="space-y-4 mt-4">
            {[
              { label: t.settings.chargerOffline, desc: t.settings.chargerOfflineDesc, enabled: true },
              { label: t.settings.faultDetected, desc: t.settings.faultDetectedDesc, enabled: true },
              { label: t.settings.sessionComplete, desc: t.settings.sessionCompleteDesc, enabled: false },
              { label: t.settings.aiAnomaly, desc: t.settings.aiAnomalyDesc, enabled: true },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">{n.label}</p>
                  <p className="text-xs text-slate-400">{n.desc}</p>
                </div>
                <ToggleSwitch enabled={n.enabled} />
              </div>
            ))}
            <p className="text-xs text-slate-400 italic">{t.settings.notifNote}</p>
          </div>
        </div>

      </div>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</div>
      <p className="font-semibold text-slate-800 text-sm">{title}</p>
    </div>
  )
}

function HealthItem({ label, value, ok, loading }: { label: string; value?: string; ok: boolean; loading: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50">
      <span className="text-sm text-slate-500">{label}</span>
      {loading ? (
        <div className="skeleton h-4 w-16 rounded" />
      ) : (
        <span className={`flex items-center gap-1.5 text-sm font-medium ${ok ? 'text-emerald-600' : 'text-rose-500'}`}>
          <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {value ?? 'unknown'}
        </span>
      )}
    </div>
  )
}

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0 ${enabled ? 'bg-blue-500' : 'bg-slate-200'}`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </div>
  )
}
