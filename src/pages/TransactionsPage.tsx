import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowLeftRight, Clock, Zap, User } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import SearchInput from '@/components/SearchInput'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { TableSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton'
import StatCard from '@/components/StatCard'
import { useInfiniteTransactions, useTransactionOverview } from '@/hooks/useTransactions'
import { formatDateTime, formatDuration, formatEnergy } from '@/utils/formatters'
import type { Transaction } from '@/types'
import { useLang } from '@/contexts/LangContext'

const STATUS_OPTIONS = ['All', 'active', 'completed', 'stopped', 'error']
const PAGE_SIZE = 15

export default function TransactionsPage() {
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useRef<HTMLTableRowElement | null>(null)

  const { 
    data, 
    isLoading, 
    isError, 
    refetch, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteTransactions({ status: statusFilter !== 'All' ? statusFilter : undefined })
  
  const { data: overview, isLoading: overviewLoading } = useTransactionOverview()
  const rawList: Transaction[] = useMemo(() => {
    const pages = data?.pages || []
    const flatList = pages.flatMap((p: any) => p.data || [])
    
    return flatList.map((tx: any) => ({
      ...tx,
      energyConsumed: tx.energyConsumed ?? tx.energy_consumed ?? (tx.meterStop != null && tx.meterStart != null ? tx.meterStop - tx.meterStart : undefined),
      stopTime: tx.stopTime ?? tx.stop_time ?? tx.endTime ?? tx.end_time,
      startTime: tx.startTime ?? tx.start_time,
      chargePointId: tx.chargePointId ?? tx.charge_point_id ?? tx.chargepoint_id,
      idTag: tx.idTag ?? tx.id_tag,
      connectorId: tx.connectorId ?? tx.connector_id,
      meterStart: tx.meterStart ?? tx.meter_start,
      meterStop: tx.meterStop ?? tx.meter_stop,
      stopReason: tx.stopReason ?? tx.stop_reason,
      status: String(tx.status || (tx.stopTime ? 'completed' : 'active')).toLowerCase()
    }))
  }, [data?.pages])

  const filtered = useMemo(() => {
    return rawList.filter((tx) => {
      const matchSearch = !search ||
        String(tx.id).includes(search) ||
        tx.chargePointId?.toLowerCase().includes(search.toLowerCase()) ||
        tx.idTag?.toLowerCase().includes(search.toLowerCase())
      
      const txStatus = tx.status
      const currentFilter = statusFilter.toLowerCase()
      const matchStatus = currentFilter === 'all' || txStatus === currentFilter

      return matchSearch && matchStatus
    })
  }, [rawList, search, statusFilter])

  // Infinite Scroll Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    })

    if (lastElementRef.current) {
      observerRef.current.observe(lastElementRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const paginated = filtered

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title={t.transactions.title} subtitle={t.transactions.subtitle} />

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title={t.transactions.totalSessions} value={overview?.total ?? rawList.length} icon={<ArrowLeftRight size={18} />} variant="blue" />
            <StatCard title={t.transactions.active} value={overview?.active ?? rawList.filter(tx => !tx.stopTime).length} icon={<Zap size={18} />} variant="emerald" />
            <StatCard title={t.transactions.completed} value={overview?.completed ?? rawList.filter(tx => !!tx.stopTime).length} icon={<Clock size={18} />} variant="default" />
            <StatCard title={t.transactions.totalEnergy} value={formatEnergy(overview?.totalEnergy)} icon={<Zap size={18} />} variant="amber" />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t.transactions.searchPlaceholder} className="flex-1 max-w-sm" />
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              {s === 'All' ? t.common.all : (t.status[s as keyof typeof t.status] ?? s)}
            </button>
          ))}
        </div>
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ArrowLeftRight size={22} />} title={t.transactions.noTransactions} description={t.transactions.noTransactionsDesc} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[t.transactions.id, t.transactions.chargePoint, t.transactions.connector, t.transactions.idTag, t.transactions.start, t.transactions.stop, t.transactions.duration, t.transactions.energy, t.transactions.status].map((h) => (
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
                        ref={idx === paginated.length - 1 ? lastElementRef : null}
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
                          {t.common.view}
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

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Visible count indicator */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-4">
          {t.common.showingResults(1, filtered.length, data?.pages[0]?.meta?.total || filtered.length)}
        </p>
      )}

      {/* Detail Drawer */}
      {selected && <TransactionDrawer tx={selected} onClose={() => setSelected(null)} t={t} />}
    </div>
  )
}

function TransactionDrawer({ tx, onClose, t }: { tx: Transaction; onClose: () => void; t: any }) {
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
            <p className="font-bold text-slate-900">{t.transactions.transactionTitle(tx.id)}</p>
            <StatusBadge status={status} />
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <DrawerSection title={t.transactions.general}>
            <DrawerRow label={t.transactions.chargePointLabel} value={tx.chargePointId} />
            <DrawerRow label={t.transactions.connectorId} value={tx.connectorId} />
            <DrawerRow label={t.transactions.idTag} value={tx.idTag} mono />
          </DrawerSection>
          <DrawerSection title={t.transactions.timing}>
            <DrawerRow label={t.transactions.startTime} value={formatDateTime(tx.startTime)} />
            <DrawerRow label={t.transactions.stopTime} value={formatDateTime(tx.stopTime)} />
            <DrawerRow label={t.transactions.duration} value={formatDuration(tx.startTime, tx.stopTime ?? null)} />
            <DrawerRow label={t.transactions.stopReason} value={tx.stopReason} />
          </DrawerSection>
          <DrawerSection title={t.transactions.energySection}>
            <DrawerRow label={t.transactions.meterStart} value={tx.meterStart != null ? `${tx.meterStart} Wh` : undefined} />
            <DrawerRow label={t.transactions.meterStop} value={tx.meterStop != null ? `${tx.meterStop} Wh` : undefined} />
            <DrawerRow label={t.transactions.energyConsumed} value={formatEnergy(tx.energyConsumed)} highlight />
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
