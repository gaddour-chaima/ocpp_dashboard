import { BrainCircuit, TrendingUp, AlertTriangle, Sparkles, Clock, Zap, CheckCircle } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import PageHeader from '@/components/PageHeader'
import ChartCard from '@/components/ChartCard'
import { ChartSkeleton } from '@/components/LoadingSkeleton'
import { useAiForecast, useAiAnomaly } from '@/hooks/useAi'
import { formatEnergy, formatDateTime } from '@/utils/formatters'

export default function AiInsightsPage() {
  const { data: forecast, isLoading: fLoading, isError: fError } = useAiForecast()
  const { data: anomaly, isLoading: aLoading, isError: aError } = useAiAnomaly()

  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])

  const forecastData = getArray(forecast?.forecast ?? forecast)
  const anomalies = getArray(anomaly?.anomalies ?? anomaly)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Insights"
        subtitle="Machine learning forecasting and anomaly detection"
        actions={
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', color: '#4f46e5', border: '1px solid #c7d2fe' }}
          >
            <Sparkles size={12} /> AI-Powered
          </span>
        }
      />

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1526 0%, #1e1654 50%, #172140 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 60%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 60%)', transform: 'translate(-30%, 30%)' }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%)', boxShadow: '0 0 24px rgba(139,92,246,0.4)' }}>
            <BrainCircuit size={26} color="white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Intelligent EV Infrastructure Analytics</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-lg">
              Advanced ML models analyze your charging data to predict demand, detect anomalies, and optimize energy distribution across your EV network.
            </p>
          </div>
          <div className="sm:ml-auto flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-slate-300 border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Module active
            </span>
          </div>
        </div>
      </div>

      {/* Forecast & Anomaly Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Energy Forecast */}
        <div className="space-y-4">
          <ChartCard
            title="Energy Demand Forecast"
            subtitle="Predicted consumption for upcoming period"
            action={
              <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">ML Forecast</span>
            }
          >
            {fLoading ? <ChartSkeleton height={200} /> : fError ? (
              <AiPlaceholderChart color="#8b5cf6" label="Energy Forecast" />
            ) : forecastData.length === 0 ? (
              <AiPlaceholderChart color="#8b5cf6" label="Energy Forecast" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={forecastData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => [`${(v / 1000).toFixed(2)} kWh`, 'Forecast']} />
                  <Area type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" fill="url(#fGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Forecast Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Forecast Summary</p>
                <p className="text-xs text-slate-400">Next period prediction</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Predicted Energy', value: forecast?.predictedEnergy ? formatEnergy(forecast.predictedEnergy) : '~124 kWh', icon: <Zap size={14} className="text-violet-500" /> },
                { label: 'Confidence', value: `${forecast?.confidence ?? 87}%`, icon: <CheckCircle size={14} className="text-emerald-500" /> },
                { label: 'Period', value: forecast?.period ?? '7 days', icon: <Clock size={14} className="text-blue-500" /> },
                { label: 'Model', value: 'LSTM v2.1', icon: <BrainCircuit size={14} className="text-slate-400" /> },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-xs text-slate-500">{item.label}</span></div>
                  <p className="text-sm font-bold text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
            {(fError || !forecast) && (
              <p className="text-xs text-slate-400 mt-3 italic text-center">
                ✦ Advanced ML module — connect backend AI service to activate live forecasts
              </p>
            )}
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: '1px solid #fecdd3' }}>
                <AlertTriangle size={18} className="text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Anomaly Detection</p>
                <p className="text-xs text-slate-400">Real-time fault pattern recognition</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  {anomaly?.totalDetected ?? (aError ? 2 : 0)} detected
                </span>
              </div>
            </div>

            {aLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : anomalies.length > 0 ? (
              <div className="space-y-3">
                {anomalies.map((a, i) => (
                  <AnomalyCard key={i} anomaly={a} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mock anomalies for demo */}
                {MOCK_ANOMALIES.map((a, i) => <AnomalyCard key={i} anomaly={a} mock />)}
              </div>
            )}
          </div>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AI_FEATURES.map((feat, i) => (
              <div
                key={i}
                className="card p-4 hover:shadow-md transition-shadow cursor-default"
                style={{ borderLeft: `3px solid ${feat.color}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: feat.color }}>{feat.icon}</span>
                  <p className="text-xs font-semibold text-slate-700">{feat.title}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.description}</p>
                <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: `${feat.color}15`, color: feat.color }}>
                  {feat.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'linear-gradient(135deg, #ede9fe10, #dbeafe10)', border: '1px solid #e2e8f0' }}
      >
        <Sparkles size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Integration Ready:</span> These AI modules are designed to connect with your backend ML pipeline. Replace the placeholder endpoints at <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/api/ai/forecast-energy</code> and <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">/api/ai/anomaly-detection</code> with your trained models.
        </p>
      </div>
    </div>
  )
}

function AiPlaceholderChart({ color, label }: { color: string; label: string }) {
  const data = Array.from({ length: 14 }, (_, i) => ({
    date: `D+${i + 1}`,
    energy: 80000 + Math.sin(i * 0.8) * 30000 + Math.random() * 20000,
  }))
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
          <Area type="monotone" dataKey="energy" stroke={color} strokeWidth={2} strokeDasharray="6 3" fill="url(#demoGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-slate-400 bg-white/80 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
          Demo data — connect AI backend for live forecast
        </span>
      </div>
    </div>
  )
}

function AnomalyCard({ anomaly, mock }: { anomaly: { chargePointId: string; type: string; severity: string; timestamp: string; description?: string }; mock?: boolean }) {
  const severityColors: Record<string, string> = {
    high: '#f43f5e', medium: '#f59e0b', low: '#3b82f6', critical: '#7c3aed'
  }
  const color = severityColors[anomaly.severity?.toLowerCase()] ?? '#64748b'
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${mock ? 'opacity-70' : ''}`}
      style={{ background: `${color}08`, borderColor: `${color}25` }}>
      <AlertTriangle size={15} style={{ color, marginTop: '1px', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-800">{anomaly.type}</p>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}>
            {anomaly.severity}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{anomaly.chargePointId} — {anomaly.description ?? 'Unusual pattern detected'}</p>
        <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(anomaly.timestamp)}</p>
      </div>
      {mock && <span className="text-[10px] text-slate-300 flex-shrink-0">demo</span>}
    </div>
  )
}

const MOCK_ANOMALIES = [
  { chargePointId: 'CP-001', type: 'Over-current Spike', severity: 'high', timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Current exceeded 32A threshold' },
  { chargePointId: 'CP-003', type: 'Repeated Disconnects', severity: 'medium', timestamp: new Date(Date.now() - 7200000).toISOString(), description: '4 disconnections in 1 hour' },
]

const AI_FEATURES = [
  { title: 'Demand Forecasting', description: 'LSTM neural network predicts peak charging demand 7 days ahead.', color: '#8b5cf6', status: 'Ready to integrate', icon: <TrendingUp size={14} /> },
  { title: 'Fault Detection', description: 'Isolation Forest identifies abnormal charger behavior in real-time.', color: '#f43f5e', status: 'Ready to integrate', icon: <AlertTriangle size={14} /> },
  { title: 'Load Balancing', description: 'Reinforcement learning optimizes power distribution across chargers.', color: '#3b82f6', status: 'Coming soon', icon: <Zap size={14} /> },
  { title: 'Session Prediction', description: 'Predict session duration and energy needs at session start.', color: '#10b981', status: 'Coming soon', icon: <Clock size={14} /> },
]
