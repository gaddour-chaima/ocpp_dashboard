import { AlertTriangle, BrainCircuit, CheckCircle, Clock, ListChecks, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard from '@/components/ChartCard'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { ChartSkeleton } from '@/components/LoadingSkeleton'
import PageHeader from '@/components/PageHeader'
import { useLang } from '@/contexts/LangContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAiAnomalies, useAiForecast, useAiRecommendations, useAiSummary } from '@/hooks/useAi'
import { formatDateTime, formatEnergy, formatNumber } from '@/utils/formatters'

export default function AiInsightsPage() {
  const { t } = useLang()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const forecastQuery = useAiForecast()
  const anomaliesQuery = useAiAnomalies()
  const summaryQuery = useAiSummary()
  const recommendationsQuery = useAiRecommendations()

  const forecastData = forecastQuery.data?.forecast ?? []
  const anomalies = anomaliesQuery.data?.anomalies ?? []
  const summary = summaryQuery.data
  const recommendations = recommendationsQuery.data?.recommendations ?? []

  const anyError =
    forecastQuery.isError ||
    anomaliesQuery.isError ||
    summaryQuery.isError ||
    recommendationsQuery.isError

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
        title={t.aiInsights.smartSupervisionTitle}
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

      {anyError && (
        <div className="card">
          <ErrorState />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <ChartCard
            title={t.aiInsights.energyForecast}
            subtitle={t.aiInsights.forecastNext7Days}
            action={<span className="text-xs font-medium text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/20 px-2.5 py-1 rounded-full">{t.aiInsights.mlForecast}</span>}
          >
            {forecastQuery.isLoading ? (
              <ChartSkeleton height={200} />
            ) : forecastData.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={20} />}
                title={t.common.noData}
                description={t.aiInsights.noForecastData}
              />
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
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={tooltipCursor}
                    formatter={(v) => [formatEnergy(Number(v ?? 0)), t.aiInsights.predictedEnergy]}
                  />
                  <Area type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={2} fill="url(#fGrad)" dot={false} />
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
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.aiInsights.intelligentSummary}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.aiInsights.forecastSummarySub}</p>
              </div>
            </div>
            {summaryQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : !summary ? (
              <EmptyState icon={<ListChecks size={20} />} title={t.common.noData} description={t.aiInsights.noSummaryData} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.aiInsights.predictedEnergy, value: formatEnergy(summary.predictedEnergy), icon: <Zap size={14} className="text-violet-500" /> },
                  { label: t.aiInsights.confidence, value: `${summary.confidenceScore}%`, icon: <CheckCircle size={14} className="text-emerald-500" /> },
                  { label: t.aiInsights.period, value: summary.predictionPeriod, icon: <Clock size={14} className="text-blue-500" /> },
                  { label: t.aiInsights.model, value: summary.modelName, icon: <BrainCircuit size={14} className="text-slate-400" /> },
                  { label: t.aiInsights.detected, value: formatNumber(summary.anomaliesCount), icon: <AlertTriangle size={14} className="text-rose-500" /> },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      {item.icon}
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
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
                  {formatNumber(anomalies.length)} {t.aiInsights.detected}
                </span>
              </div>
            </div>
            {anomaliesQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
            ) : anomalies.length === 0 ? (
              <EmptyState icon={<AlertTriangle size={20} />} title={t.common.noData} description={t.aiInsights.noAnomaliesData} />
            ) : (
              <div className="space-y-3">
                {anomalies.map((item, i) => (
                  <AnomalyCard
                    key={`${item.chargePointId}-${item.timestamp}-${i}`}
                    anomaly={{
                      chargePointId: item.chargePointId,
                      type: item.type,
                      severity: item.severity,
                      timestamp: item.timestamp,
                      explanation: item.explanation,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center">
                <ListChecks size={16} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.aiInsights.recommendationsTitle}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.aiInsights.recommendationsSub}</p>
              </div>
            </div>
            {recommendationsQuery.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
            ) : recommendations.length === 0 ? (
              <EmptyState icon={<ListChecks size={20} />} title={t.common.noData} description={t.aiInsights.noRecommendationsData} />
            ) : (
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={rec.id || `${i}`} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{rec.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnomalyCard({
  anomaly,
}: {
  anomaly: { chargePointId: string; type: string; severity: string; timestamp: string; explanation: string }
}) {
  const severityColors: Record<string, string> = { high: '#f43f5e', medium: '#f59e0b', low: '#3b82f6', critical: '#7c3aed' }
  const color = severityColors[anomaly.severity?.toLowerCase()] ?? '#64748b'
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
      <AlertTriangle size={15} style={{ color, marginTop: '1px', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{anomaly.type}</p>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
            {anomaly.severity}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {anomaly.chargePointId} - {anomaly.explanation}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{formatDateTime(anomaly.timestamp)}</p>
      </div>
    </div>
  )
}
