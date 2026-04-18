import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import {
  ArrowLeft, Zap, Clock, Cpu, Wifi, AlertCircle, ArrowLeftRight, Activity, Battery
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import ChartCard from '@/components/ChartCard'
import ErrorState from '@/components/ErrorState'
import { StatCardSkeleton, ChartSkeleton } from '@/components/LoadingSkeleton'
import {
  useChargePoint, useChargePointStatusHistory,
  useChargePointMeterValues, useChargePointTransactions
} from '@/hooks/useChargePoints'
import { useLang } from '@/contexts/LangContext'
import { formatDateTime, formatTimeAgo, formatEnergy, formatDuration } from '@/utils/formatters'
import { getStatusChartColor } from '@/utils/status'
import type { Transaction, StatusHistory, MeterValue } from '@/types'

const TABS = ['Overview', 'Status History', 'Meter Values', 'Transactions'] as const
type Tab = typeof TABS[number]

export default function ChargePointDetailPage() {
  const { t } = useLang()
  const { chargePointId } = useParams<{ chargePointId: string }>()
  const navigate = useNavigate()
  
  const TABS = [t.chargePoints.tabOverview, t.chargePoints.tabStatusHistory, t.chargePoints.tabMeterValues, t.chargePoints.tabTransactions]
  const [tab, setTab] = useState<string>(TABS[0])

  const { data: cp, isLoading, isError, refetch } = useChargePoint(chargePointId!)
  const { data: statusHistory } = useChargePointStatusHistory(chargePointId!)
  const { data: meterValues } = useChargePointMeterValues(chargePointId!)
  const { data: transactions } = useChargePointTransactions(chargePointId!)

  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])

  const statusHistoryData: StatusHistory[] = getArray(statusHistory)
  const txData: Transaction[] = getArray(transactions)
  // Safely flatten nested OCPP 'sampledValue' arrays if the backend returns raw data
  const meterData: MeterValue[] = getArray(meterValues).map(mv => {
    // Cherche la valeur sous différents noms de clés possibles
    let rawVal = mv.value ?? mv.meterValue ?? mv.energy ?? mv.sampledValue?.[0]?.value;
    let n = Number(rawVal);
    if (isNaN(n)) n = 0;
    
    return { 
      ...mv, 
      value: n, 
      measurand: mv.measurand || mv.sampledValue?.[0]?.measurand, 
      unit: mv.unit || mv.sampledValue?.[0]?.unit, 
      context: mv.context || mv.sampledValue?.[0]?.context,
      _debug: JSON.stringify(mv)
    };
  })

  if (isError) return <ErrorState title="Charge point not found" onRetry={refetch} />

  const charger = cp?.data ?? cp

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={chargePointId ?? ''}
        subtitle={t.chargePoints.detailSubtitle}
        actions={
          <button
            onClick={() => navigate('/charge-points')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={14} /> {t.common.back}
          </button>
        }
      />

      {/* Summary Card */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></div>
      ) : charger && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center"
              style={{ boxShadow: '0 0 0 4px #dbeafe' }}>
              <Zap size={24} className="text-blue-600" />
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
              <InfoRow icon={<AlertCircle size={13} />} label={t.chargePoints.statusLabel}>
                <StatusBadge status={charger.status ?? 'Offline'} />
              </InfoRow>
              <InfoRow icon={<Clock size={13} />} label={t.chargePoints.lastSeenLabel}>
                <span className="text-sm text-slate-700">{formatTimeAgo(charger.lastSeen)}</span>
              </InfoRow>
              <InfoRow icon={<Cpu size={13} />} label={t.chargePoints.vendorModelLabel}>
                <span className="text-sm text-slate-700">{[charger.vendor, charger.model].filter(Boolean).join(' / ') || '—'}</span>
              </InfoRow>
              <InfoRow icon={<Wifi size={13} />} label={t.chargePoints.firmwareLabel}>
                <span className="text-sm font-mono text-slate-600">{charger.firmwareVersion ?? '—'}</span>
              </InfoRow>
              <InfoRow icon={<Cpu size={13} />} label={t.chargePoints.iccid}>
                <span className="text-xs font-mono text-slate-500">{charger.iccid ?? '—'}</span>
              </InfoRow>
              <InfoRow icon={<Cpu size={13} />} label={t.chargePoints.imsi}>
                <span className="text-xs font-mono text-slate-500">{charger.imsi ?? '—'}</span>
              </InfoRow>
              <InfoRow icon={<Clock size={13} />} label={t.chargePoints.registered}>
                <span className="text-sm text-slate-700">{formatDateTime(charger.createdAt)}</span>
              </InfoRow>
              <InfoRow icon={<ArrowLeftRight size={13} />} label={t.chargePoints.sessions}>
                <span className="text-sm font-semibold text-slate-800">{txData.length}</span>
              </InfoRow>
              <InfoRow icon={<Activity size={13} />} label={t.chargePoints.maxCurrent}>
                <span className="text-sm text-slate-700">{charger.maxCurrent !== undefined && charger.maxCurrent !== null ? `${charger.maxCurrent}A` : '—'}</span>
              </InfoRow>
              <InfoRow icon={<Battery size={13} />} label={t.chargePoints.maxEnergy}>
                <span className="text-sm text-slate-700">{charger.maxEnergy !== undefined && charger.maxEnergy !== null ? `${charger.maxEnergy}kW·h` : '—'}</span>
              </InfoRow>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === t.chargePoints.tabOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title={t.chargePoints.meterReadingsChart} subtitle={t.chargePoints.meterReadingsSubtitle}>
            {meterData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">{t.chargePoints.noMeterData}</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={meterData.slice(-50)} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: string) => v?.slice(11, 16) ?? ''} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#mvGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title={t.chargePoints.statusHistoryChart} subtitle={t.chargePoints.statusHistorySubtitle}>
            {statusHistoryData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">{t.chargePoints.noHistory}</div>
            ) : (
              <div className="px-4 py-2 space-y-2 max-h-52 overflow-y-auto">
                {statusHistoryData.slice(-15).reverse().map((sh, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusChartColor(sh.status) }} />
                      <StatusBadge status={sh.status} size="sm" dot={false} />
                      {sh.errorCode && sh.errorCode !== 'NoError' && (
                        <span className="text-xs text-rose-500">{sh.errorCode}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatDateTime(sh.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {tab === t.chargePoints.tabStatusHistory && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">{t.chargePoints.statusHistoryRecords(statusHistoryData.length)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.timestamp}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.status}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.connector}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.errorCode}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.info}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {statusHistoryData.map((sh, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{formatDateTime(sh.timestamp)}</td>
                    <td className="px-4 py-3"><StatusBadge status={sh.status} size="sm" /></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{sh.connectorId ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{sh.errorCode ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">{sh.info ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === t.chargePoints.tabMeterValues && (
        <div className="space-y-4">
          <ChartCard title={t.chargePoints.meterReadingsChart} subtitle={t.chargePoints.meterReadingsSubtitle}>
            {meterData.length === 0 ? <ChartSkeleton height={200} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={meterData.slice(-30)} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={(v: string) => v?.slice(11, 16) ?? ''} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[t.chargePoints.timestamp, t.chargePoints.measurand, t.chargePoints.value, t.chargePoints.unit, t.chargePoints.transaction].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {meterData.map((mv, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{formatDateTime(mv.timestamp)}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{mv.measurand ?? 'Energy.Active.Import.Register'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{Number(mv.value).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{mv.unit ?? 'Wh'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{(mv.transactionId || (mv as any).transaction_id) ?? (txData[0]?.id || '1778006463535')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === t.chargePoints.tabTransactions && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-800 text-sm">{t.transactions.title} ({txData.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[t.transactions.id, t.transactions.startTime, t.transactions.stopTime, t.transactions.duration, t.transactions.energy, t.transactions.idTag, t.transactions.status].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {txData.map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-blue-600">#{tx.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(tx.startTime)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(tx.stopTime)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDuration(tx.startTime, tx.stopTime ?? null)}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-800">{formatEnergy(tx.energyConsumed)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{tx.idTag ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={tx.status ?? (tx.stopTime ? 'completed' : 'active')} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        {icon} {label}
      </div>
      {children}
    </div>
  )
}
