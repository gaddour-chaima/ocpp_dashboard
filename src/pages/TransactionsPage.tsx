import { useState, useMemo } from 'react'
import { ArrowLeftRight, Clock, Zap, User } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import SearchInput from '@/components/SearchInput'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { TableSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton'
import StatCard from '@/components/StatCard'
import { useTransactions, useTransactionOverview } from '@/hooks/useTransactions'
import { formatDateTime, formatDuration, formatEnergy } from '@/utils/formatters'
import type { Transaction } from '@/types'

const STATUS_OPTIONS = ['All', 'active', 'completed', 'stopped', 'error']
const PAGE_SIZE = 15

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const { data, isLoading, isError, refetch } = useTransactions()
  const { data: overview, isLoading: overviewLoading } = useTransactionOverview()
  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])
  const rawList: Transaction[] = getArray(data).map((tx: any) => ({
    ...tx,
    // Calcule energyConsumed si non renvoyé par le backend (meterStop - meterStart)
    energyConsumed: tx.energyConsumed
      ?? tx.energy_consumed
      ?? (tx.meterStop != null && tx.meterStart != null ? tx.meterStop - tx.meterStart : undefined),
    stopTime: tx.stopTime ?? tx.stop_time ?? tx.endTime ?? tx.end_time,
    startTime: tx.startTime ?? tx.start_time,
    chargePointId: tx.chargePointId ?? tx.charge_point_id ?? tx.chargepoint_id,
    idTag: tx.idTag ?? tx.id_tag,
    connectorId: tx.connectorId ?? tx.connector_id,
    meterStart: tx.meterStart ?? tx.meter_start,
    meterStop: tx.meterStop ?? tx.meter_stop,
    stopReason: tx.stopReason ?? tx.stop_reason,
  }))

  const filtered = useMemo(() => {
    return rawList.filter((tx) => {
      const s = tx.status ?? (tx.stopTime ? 'completed' : 'active')
      const matchSearch = !search ||
        String(tx.id).includes(search) ||
        tx.chargePointId?.toLowerCase().includes(search.toLowerCase()) ||
        tx.idTag?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'All' || s === statusFilter
      return matchSearch && matchStatus
    })
  }, [rawList, search, statusFilter])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Transactions" subtitle="Charging session history and activity" />

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Sessions" value={overview?.total ?? rawList.length} icon={<ArrowLeftRight size={18} />} variant="blue" />
            <StatCard title="Active" value={overview?.active ?? rawList.filter(t => !t.stopTime).length} icon={<Zap size={18} />} variant="emerald" />
            <StatCard title="Completed" value={overview?.completed ?? rawList.filter(t => !!t.stopTime).length} icon={<Clock size={18} />} variant="default" />
            <StatCard title="Total Energy" value={formatEnergy(overview?.totalEnergy)} icon={<Zap size={18} />} variant="amber" />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by ID, charger, tag…" className="flex-1 max-w-sm" />
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ArrowLeftRight size={22} />} title="No transactions found" description="Try adjusting your filters." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['ID', 'Charge Point', 'Connector', 'ID Tag', 'Start', 'Stop', 'Duration', 'Energy', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((tx, idx) => {
                  const status = tx.status ?? (tx.stopTime ? 'completed' : 'active')
                  return (
                    <tr
                      key={tx.id ? `tx-${tx.id}` : `tx-fallback-${idx}`}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelected(tx)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-blue-600 font-medium">#{tx.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Zap size={12} className="text-blue-400 flex-shrink-0" />
                          <span className="text-xs text-slate-700 font-medium">{tx.chargePointId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{tx.connectorId ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          <span className="text-xs font-mono text-slate-600">{tx.idTag ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatDateTime(tx.startTime)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatDateTime(tx.stopTime)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{formatDuration(tx.startTime, tx.stopTime ?? null)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800">{formatEnergy(tx.energyConsumed)}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} size="sm" /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(tx) }}
                          className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && (
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      )}

      {/* Detail Drawer */}
      {selected && <TransactionDrawer tx={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function TransactionDrawer({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const status = tx.status ?? (tx.stopTime ? 'completed' : 'active')
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in"
        style={{ borderLeft: '1px solid #e2e8f0' }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="font-bold text-slate-900">Transaction #{tx.id}</p>
            <StatusBadge status={status} />
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <DrawerSection title="General">
            <DrawerRow label="Charge Point" value={tx.chargePointId} />
            <DrawerRow label="Connector ID" value={tx.connectorId} />
            <DrawerRow label="ID Tag" value={tx.idTag} mono />
          </DrawerSection>
          <DrawerSection title="Timing">
            <DrawerRow label="Start Time" value={formatDateTime(tx.startTime)} />
            <DrawerRow label="Stop Time" value={formatDateTime(tx.stopTime)} />
            <DrawerRow label="Duration" value={formatDuration(tx.startTime, tx.stopTime ?? null)} />
            <DrawerRow label="Stop Reason" value={tx.stopReason} />
          </DrawerSection>
          <DrawerSection title="Energy">
            <DrawerRow label="Meter Start" value={tx.meterStart != null ? `${tx.meterStart} Wh` : undefined} />
            <DrawerRow label="Meter Stop" value={tx.meterStop != null ? `${tx.meterStop} Wh` : undefined} />
            <DrawerRow label="Energy Consumed" value={formatEnergy(tx.energyConsumed)} highlight />
          </DrawerSection>
        </div>
      </div>
    </>
  )
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function DrawerRow({ label, value, mono, highlight }: { label: string; value?: string | number | null; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'font-bold text-slate-900' : 'text-slate-700'} ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}
