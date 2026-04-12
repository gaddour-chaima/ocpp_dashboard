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

        {/* Environment */}
        <div className="card p-5">
          <SectionTitle icon={<Globe size={16} className="text-emerald-500" />} title={t.settings.environment} />
          <div className="space-y-3 mt-4">
            {[
              { label: t.settings.apiBaseUrl, value: apiBase, mono: true },
              { label: t.settings.environment, value: import.meta.env.MODE ?? 'development', mono: false },
              { label: t.settings.protocol, value: 'OCPP 1.6J', mono: false },
              { label: t.settings.frontend, value: 'React + Vite + TypeScript', mono: false },
              { label: t.settings.build, value: import.meta.env.PROD ? 'Production' : 'Development', mono: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700 last:border-0 gap-4">
                <span className="text-sm text-slate-500 flex-shrink-0">{item.label}</span>
                <span className={`text-sm text-right truncate ${item.mono ? 'font-mono text-blue-600 text-xs' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                  {item.value}
                </span>
              </div>
            ))}
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
          <SectionTitle icon={<Bell size={16} className="text-amber-500" />} title="Notifications" />
          <div className="space-y-4 mt-4">
            {[
              { label: 'Charger Goes Offline', desc: 'Alert when a charger disconnects', enabled: true },
              { label: 'Fault Detected', desc: 'Alert on Faulted status', enabled: true },
              { label: 'Session Complete', desc: 'Notify when charging ends', enabled: false },
              { label: 'AI Anomaly', desc: 'Alert when AI detects unusual behavior', enabled: true },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">{n.label}</p>
                  <p className="text-xs text-slate-400">{n.desc}</p>
                </div>
                <ToggleSwitch enabled={n.enabled} />
              </div>
            ))}
            <p className="text-xs text-slate-400 italic">Notification delivery connects to your alerting backend.</p>
          </div>
        </div>

        {/* Security */}
        <div className="card p-5">
          <SectionTitle icon={<Shield size={16} className="text-rose-500" />} title="Security" />
          <div className="space-y-3 mt-4">
            {[
              { label: 'Authentication', value: 'JWT Bearer Token (placeholder)' },
              { label: 'OCPP Auth', value: 'Basic Auth / Certificates' },
              { label: 'TLS', value: 'WSS Secured' },
              { label: 'Session Timeout', value: '30 minutes' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm text-slate-700 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card p-5">
          <SectionTitle icon={<Info size={16} className="text-slate-400" />} title="About" />
          <div className="mt-4 space-y-3">
            {[
              { label: 'Project', value: 'OCPP EV Charging Dashboard' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Protocol', value: 'OCPP 1.6 JSON' },
              { label: 'Framework', value: 'React 18 + Vite + TypeScript' },
              { label: 'Charting', value: 'Recharts' },
              { label: 'State', value: 'TanStack Query v5' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm text-slate-700 font-medium">{item.value}</span>
              </div>
            ))}
            <p className="text-xs text-slate-400 italic mt-2 text-center">
              Final Year Engineering Project — EV Charging Management Platform
            </p>
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
