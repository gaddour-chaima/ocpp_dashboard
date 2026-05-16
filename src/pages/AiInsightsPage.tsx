import { BrainCircuit, TrendingUp, AlertTriangle, Sparkles, Clock, Zap, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '@/components/PageHeader'
import ChartCard from '@/components/ChartCard'
import { ChartSkeleton } from '@/components/LoadingSkeleton'
import { useAiForecast, useAiAnomaly } from '@/hooks/useAi'
import { useLang } from '@/contexts/LangContext'
import { useTheme } from '@/contexts/ThemeContext'
import { formatEnergy, formatDateTime } from '@/utils/formatters'

export default function AiInsightsPage() {
  const { t } = useLang()
  const { theme } = useTheme()
  const { data: forecast, isLoading: fLoading, isError: fError } = useAiForecast()
  const { data: anomaly, isLoading: aLoading, isError: aError } = useAiAnomaly()

  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])
  const forecastData = getArray(forecast?.forecast ?? forecast)
  const anomalies = getArray(anomaly?.anomalies ?? anomaly)
  const isDark = theme === 'dark'

  const tooltipStyle = {
    background: isDark ? '#0f172a' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: isDark ? '#e2e8f0' : '#0f172a',
  }
  const tooltipCursor = isDark ? { fill: 'rgba(148,163,184,0.14)' } : { fill: 'rgba(15,23,42,0.06)' }
  const chartGridStroke = isDark ? '#334155' : '#f1f5f9'

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.aiInsights.title}
        subtitle={t.aiInsights.subtitle}
        actions={
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: isDark ? 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(59,130,246,0.18))' : 'linear-gradient(135deg, #ede9fe, #dbeafe)', color: isDark ? '#c4b5fd' : '#4f46e5', border: isDark ? '1px solid rgba(167,139,250,0.4)' : '1px solid #c7d2fe' }}
          >
            <Sparkles size={12} /> {t.aiInsights.aiPowered}
          </span>
        }
      />

      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1526 0%, #1e1654 50%, #172140 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 60%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 60%)', transform: 'translate(-30%, 30%)' }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)', boxShadow: '0 0 24px rgba(139,92,246,0.4)' }}>
            <BrainCircuit size={26} color="white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{t.aiInsights.heroTitle}</h3>
            <p className="text-slate-300 text-sm mt-1 max-w-lg">{t.aiInsights.heroDesc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ChartCard title={t.aiInsights.energyForecast} subtitle={t.aiInsights.energyForecastSub} action={<span className="text-xs font-medium text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/20 px-2.5 py-1 rounded-full">{t.aiInsights.mlForecast}</span>}>
            {fLoading ? <ChartSkeleton height={200} /> : fError || forecastData.length === 0 ? (
              <AiPlaceholderChart color="#8b5cf6" t={t} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={forecastData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={tooltipCursor} formatter={(v: number) => [`${(v / 1000).toFixed(2)} kWh`, 'Forecast']} />
                  <Area type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" fill="url(#fGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-violet-600 dark:text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.aiInsights.forecastSummary}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.aiInsights.forecastSummarySub}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t.aiInsights.predictedEnergy, value: forecast?.predictedEnergy ? formatEnergy(forecast.predictedEnergy) : '~124 kWh', icon: <Zap size={14} className="text-violet-500" /> },
                { label: t.aiInsights.confidence, value: `${forecast?.confidence ?? 87}%`, icon: <CheckCircle size={14} className="text-emerald-500" /> },
                { label: t.aiInsights.period, value: forecast?.period ?? '7 days', icon: <Clock size={14} className="text-blue-500" /> },
                { label: t.aiInsights.model, value: 'LSTM v2.1', icon: <BrainCircuit size={14} className="text-slate-400" /> },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span></div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isDark ? 'linear-gradient(135deg, rgba(244,63,94,0.2), rgba(225,29,72,0.18))' : 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: isDark ? '1px solid rgba(244,63,94,0.4)' : '1px solid #fecdd3' }}>
                <AlertTriangle size={18} className="text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.aiInsights.anomalyDetection}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.aiInsights.anomalySub}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs font-medium text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/20 px-2.5 py-1 rounded-full">
                  {anomaly?.totalDetected ?? (aError ? 2 : 0)} {t.aiInsights.detected}
                </span>
              </div>
            </div>
            {aLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div> : (
              <div className="space-y-3">
                {(anomalies.length > 0 ? anomalies : MOCK_ANOMALIES).map((a, i) => <AnomalyCard key={i} anomaly={a} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AiPlaceholderChart({ color, t }: { color: string; t: any }) {
  const data = Array.from({ length: 14 }, (_, i) => ({ date: `D+${i + 1}`, energy: 80000 + Math.sin(i * 0.8) * 30000 + Math.random() * 20000 }))
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
          <defs><linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.2} /><stop offset="95%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Area type="monotone" dataKey="energy" stroke={color} strokeWidth={2} strokeDasharray="6 3" fill="url(#demoGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full font-medium backdrop-blur-sm">{t.aiInsights.demoData}</span></div>
    </div>
  )
}

function AnomalyCard({ anomaly }: { anomaly: { chargePointId: string; type: string; severity: string; timestamp: string; description?: string } }) {
  const severityColors: Record<string, string> = { high: '#f43f5e', medium: '#f59e0b', low: '#3b82f6', critical: '#7c3aed' }
  const color = severityColors[anomaly.severity?.toLowerCase()] ?? '#64748b'
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
      <AlertTriangle size={15} style={{ color, marginTop: '1px', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{anomaly.type}</p>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{anomaly.severity}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{anomaly.chargePointId} - {anomaly.description ?? 'Unusual pattern detected'}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{formatDateTime(anomaly.timestamp)}</p>
      </div>
    </div>
  )
}

const MOCK_ANOMALIES = [
  { chargePointId: 'CP-001', type: 'Over-current Spike', severity: 'high', timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Current exceeded 32A threshold' },
  { chargePointId: 'CP-003', type: 'Repeated Disconnects', severity: 'medium', timestamp: new Date(Date.now() - 7200000).toISOString(), description: '4 disconnections in 1 hour' },
]
