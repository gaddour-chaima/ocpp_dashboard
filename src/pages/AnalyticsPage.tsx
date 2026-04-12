import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, Zap, BarChart3, Wifi } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import ChartCard from '@/components/ChartCard'
import StatCard from '@/components/StatCard'
import { ChartSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton'
import ErrorState from '@/components/ErrorState'
import {
  useEnergyDaily, useEnergyMonthly, useSessionsDaily,
  useStatusDistribution, useAvailability, useStatsOverview
} from '@/hooks/useStats'
import { formatEnergy } from '@/utils/formatters'
import { getStatusChartColor } from '@/utils/status'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#64748b']

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useStatsOverview()
  const { data: energyDaily, isLoading: edLoading, isError: edError, refetch } = useEnergyDaily()
  const { data: energyMonthly, isLoading: emLoading } = useEnergyMonthly()
  const { data: sessionsDaily, isLoading: sdLoading } = useSessionsDaily()
  const { data: statusDist, isLoading: distLoading } = useStatusDistribution()
  const { data: availability, isLoading: availLoading } = useAvailability()

  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])

  const edData = getArray(energyDaily)
  const emData = getArray(energyMonthly)
  const sdData = getArray(sessionsDaily)
  const distData = getArray(statusDist)
  const availData = getArray(availability)

  if (edError) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Deep insights into energy, sessions, and availability" />

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Energy" value={formatEnergy(stats?.totalEnergy)} icon={<Zap size={18} />} variant="blue" />
            <StatCard title="Avg per Session" value={formatEnergy(stats?.avgEnergyPerSession)} icon={<TrendingUp size={18} />} variant="emerald" />
            <StatCard title="Total Sessions" value={stats?.totalTransactions ?? '—'} icon={<BarChart3 size={18} />} variant="amber" />
            <StatCard title="Online Chargers" value={stats?.onlineChargePoints ?? '—'} icon={<Wifi size={18} />} variant="default" />
          </>
        )}
      </div>

      {/* Energy Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Energy Consumption" subtitle="Wh per day — last 30 days">
          {edLoading ? <ChartSkeleton height={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={edData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="aBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => [`${(v / 1000).toFixed(2)} kWh`, 'Energy']} />
                <Area type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={2} fill="url(#aBlue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Monthly Energy Consumption" subtitle="Total kWh per month">
          {emLoading ? <ChartSkeleton height={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={emData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => [`${(v / 1000).toFixed(2)} kWh`, 'Energy']} />
                <Bar dataKey="energy" fill="url(#gMonthly)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Sessions & Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Sessions" subtitle="Number of charging sessions per day">
          {sdLoading ? <ChartSkeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sdData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Availability Rate" subtitle="% of time chargers are available">
          {availLoading ? <ChartSkeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={availData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, 'Availability']} />
                <Line type="monotone" dataKey="availability" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="uptime" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ChartCard title="Status Distribution" subtitle="Current snapshot">
            {distLoading ? <ChartSkeleton height={240} /> : (
              <div className="flex flex-col items-center gap-4 py-2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={distData} dataKey="count" nameKey="status" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {distData.map((entry: { status: string }, i: number) => (
                        <Cell key={i} fill={getStatusChartColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2 px-4 pb-2">
                  {distData.map((entry: { status: string; count: number }, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusChartColor(entry.status) }} />
                        <span className="text-slate-600">{entry.status}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard title="Comparison Overview" subtitle="Key performance indicators at a glance">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5">
              {statsLoading
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)
                : [
                    { label: 'Total Chargers', value: stats?.totalChargePoints ?? '—', color: '#3b82f6' },
                    { label: 'Online', value: stats?.onlineChargePoints ?? '—', color: '#10b981' },
                    { label: 'Charging', value: stats?.chargingChargePoints ?? '—', color: '#3b82f6' },
                    { label: 'Offline', value: stats?.offlineChargePoints ?? '—', color: '#f43f5e' },
                    { label: 'Active TX', value: stats?.activeTransactions ?? '—', color: '#10b981' },
                    { label: 'Total TX', value: stats?.totalTransactions ?? '—', color: '#64748b' },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center justify-center py-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-xs text-slate-500 mt-1 text-center">{item.label}</p>
                    </div>
                  ))
              }
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
