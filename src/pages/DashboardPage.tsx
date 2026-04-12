import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  Zap, ZapOff, BatteryCharging, Wifi, Activity,
  ArrowLeftRight, CheckCircle2, Clock, RefreshCw, TrendingUp
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import ChartCard from '@/components/ChartCard'
import StatusBadge from '@/components/StatusBadge'
import { StatCardSkeleton, ChartSkeleton } from '@/components/LoadingSkeleton'
import ErrorState from '@/components/ErrorState'
import {
  useStatsOverview, useEnergyDaily, useEnergyMonthly,
  useSessionsDaily, usePowerRealtime, useStatusDistribution, useHealth
} from '@/hooks/useStats'
import { useTransactionOverview } from '@/hooks/useTransactions'
import { useChargePoints } from '@/hooks/useChargePoints'
import { formatEnergy, formatDateTime, formatTimeAgo } from '@/utils/formatters'
import { getStatusChartColor } from '@/utils/status'

const CHART_COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useStatsOverview()
  const { data: energyDaily, isLoading: energyDailyLoading } = useEnergyDaily()
  const { data: energyMonthly, isLoading: energyMonthlyLoading } = useEnergyMonthly()
  const { data: sessionsDaily, isLoading: sessionsDailyLoading } = useSessionsDaily()
  const { data: powerRealtime, isLoading: powerLoading } = usePowerRealtime()
  const { data: statusDist, isLoading: statusDistLoading } = useStatusDistribution()
  const { data: health } = useHealth()
  const { data: txOverview } = useTransactionOverview()
  const { data: chargePoints } = useChargePoints()

  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])

  const energyDailyData = getArray(energyDaily)
  const energyMonthlyData = getArray(energyMonthly)
  const sessionsDailyData = getArray(sessionsDaily)
  const powerData = getArray(powerRealtime)
  const statusDistData = getArray(statusDist)
  const recentCPs = getArray(chargePoints).slice(0, 5)

  if (statsError) {
    return <ErrorState onRetry={refetchStats} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Charge Points"
              value={stats?.totalChargePoints ?? stats?.total_charge_points ?? '—'}
              icon={<Zap size={18} />}
              variant="blue"
              subtitle="Registered chargers"
            />
            <StatCard
              title="Online"
              value={stats?.onlineChargePoints ?? stats?.online_charge_points ?? '—'}
              icon={<Wifi size={18} />}
              variant="emerald"
              subtitle="Currently reachable"
            />
            <StatCard
              title="Offline"
              value={stats?.offlineChargePoints ?? stats?.offline_charge_points ?? '—'}
              icon={<ZapOff size={18} />}
              variant="rose"
              subtitle="Not responding"
            />
            <StatCard
              title="Charging"
              value={stats?.chargingChargePoints ?? stats?.charging_charge_points ?? '—'}
              icon={<BatteryCharging size={18} />}
              variant="blue"
              subtitle="Active sessions"
            />
            <StatCard
              title="Total Transactions"
              value={stats?.totalTransactions ?? txOverview?.total ?? '—'}
              icon={<ArrowLeftRight size={18} />}
              variant="default"
              subtitle="All time"
            />
            <StatCard
              title="Active Sessions"
              value={stats?.activeTransactions ?? txOverview?.active ?? '—'}
              icon={<Activity size={18} />}
              variant="emerald"
              subtitle="In progress"
            />
            <StatCard
              title="Total Energy"
              value={formatEnergy(stats?.totalEnergy ?? txOverview?.totalEnergy)}
              icon={<TrendingUp size={18} />}
              variant="amber"
              subtitle="All time consumed"
            />
            <StatCard
              title="Avg per Session"
              value={formatEnergy(stats?.avgEnergyPerSession ?? txOverview?.avgEnergy)}
              icon={<CheckCircle2 size={18} />}
              variant="default"
              subtitle="Mean session energy"
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Energy - spans 2 */}
        <div className="lg:col-span-2">
          <ChartCard title="Daily Energy Consumption" subtitle="Last 30 days (kWh)">
            {energyDailyLoading ? <ChartSkeleton height={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={energyDailyData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => [`${(v / 1000).toFixed(2)} kWh`, 'Energy']}
                  />
                  <Area type="monotone" dataKey="energy" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#energyGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Status Distribution */}
        <ChartCard title="Status Distribution" subtitle="Current charger states">
          {statusDistLoading ? <ChartSkeleton height={220} /> : (
            <div className="flex flex-col items-center gap-3 pb-2">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusDistData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%" cy="50%"
                    innerRadius={42} outerRadius={68}
                    paddingAngle={3}
                  >
                    {statusDistData.map((entry: { status: string }, i: number) => (
                      <Cell key={i} fill={getStatusChartColor(entry.status)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
                {statusDistData.map((entry: { status: string; count: number }, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusChartColor(entry.status) }} />
                    {entry.status} ({entry.count})
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Sessions */}
        <ChartCard title="Daily Sessions" subtitle="Charging sessions per day">
          {sessionsDailyLoading ? <ChartSkeleton height={180} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sessionsDailyData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="sessions" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                <Bar dataKey="count" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Realtime Power */}
        <ChartCard title="Realtime Power" subtitle="Live power draw (kW)" action={
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        }>
          {powerLoading ? <ChartSkeleton height={180} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={powerData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={(v: string) => v?.slice(11, 16) ?? v} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => [`${(v / 1000).toFixed(2)} kW`, 'Power']}
                />
                <Line type="monotone" dataKey="power" stroke={CHART_COLORS.amber} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Energy */}
        <div className="lg:col-span-2">
          <ChartCard title="Monthly Energy" subtitle="Energy consumption by month (kWh)">
            {energyMonthlyLoading ? <ChartSkeleton height={180} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={energyMonthlyData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => [`${(v / 1000).toFixed(2)} kWh`, 'Energy']}
                  />
                  <Bar dataKey="energy" fill="url(#monthGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* System Health & Recent Chargers */}
        <div className="space-y-4">
          {/* Health Card */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">System Health</p>
              <RefreshCw size={14} className="text-slate-400" />
            </div>
            <div className="space-y-2.5">
              <HealthRow label="API Status" value={health?.status ?? 'Online'} ok={!!health} />
              <HealthRow label="Database" value={health?.database ?? 'unknown'} ok={health?.database === 'connected'} />
              <HealthRow label="WebSocket" value={health?.websocket ?? 'unknown'} ok={health?.websocket === 'running'} />
              {health?.uptime != null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Uptime</span>
                  <span className="text-slate-700 font-medium">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Charge Points */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">Recent Chargers</p>
            <div className="space-y-2">
              {recentCPs.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">No chargers found</p>
              ) : recentCPs.map((cp: { chargePointId?: string; id?: string; status?: string; lastSeen?: string }) => (
                <div key={cp.chargePointId ?? cp.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap size={12} className="text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-slate-700 font-medium truncate">{cp.chargePointId ?? cp.id}</span>
                  </div>
                  <StatusBadge status={cp.status ?? 'Offline'} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HealthRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`flex items-center gap-1 font-medium ${ok ? 'text-emerald-600' : 'text-rose-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        {value}
      </span>
    </div>
  )
}
