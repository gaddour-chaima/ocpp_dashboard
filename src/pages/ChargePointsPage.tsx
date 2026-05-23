import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, LayoutGrid, List, Clock, Cpu, Filter, Coins, Check, RefreshCw } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import SearchInput from '@/components/SearchInput'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { useInfiniteChargePoints, useUpdateChargePoint } from '@/hooks/useChargePoints'
import { formatTimeAgo } from '@/utils/formatters'
import type { ChargePoint } from '@/types'
import { useLang } from '@/contexts/LangContext'

const STATUS_OPTIONS = ['All', 'Available', 'Charging', 'Offline', 'Faulted', 'Preparing', 'Reserved', 'Unavailable']

export default function ChargePointsPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastRowRef = useRef<HTMLTableRowElement | HTMLDivElement | null>(null)

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteChargePoints()

  const { mutateAsync: updateChargePoint } = useUpdateChargePoint()
  const [globalPrice, setGlobalPrice] = useState('')
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [priceUpdateSuccess, setPriceUpdateSuccess] = useState(false)

  // Flatten all pages
  const rawList: ChargePoint[] = useMemo(() => {
    const pages = data?.pages || []
    return pages.flatMap((p: any) => Array.isArray(p) ? p : (Array.isArray(p?.data) ? p.data : []))
  }, [data])

  const filtered = useMemo(() => {
    return rawList.filter((cp) => {
      const matchSearch = !search ||
        cp.chargePointId?.toLowerCase().includes(search.toLowerCase()) ||
        cp.vendor?.toLowerCase().includes(search.toLowerCase()) ||
        cp.model?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'All' || cp.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [rawList, search, statusFilter])

  // Infinite scroll: observe the last element
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (lastRowRef.current) {
      observerRef.current.observe(lastRowRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [filtered, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleFilterChange = (s: string) => setStatusFilter(s)
  const handleSearch = (v: string) => setSearch(v)

  const handleUpdateGlobalPrice = async () => {
    const normalizedInput = globalPrice.replace(',', '.')
    const val = parseFloat(normalizedInput)
    if (isNaN(val) || val < 0) return
    if (rawList.length === 0) return

    setIsUpdatingPrice(true)
    setPriceUpdateSuccess(false)
    try {
      await Promise.all(
        rawList.map((cp: any) =>
          updateChargePoint({ id: cp.chargePointId || cp.id, data: { pricePerKWh: val } })
        )
      )
      setPriceUpdateSuccess(true)
      setTimeout(() => setPriceUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update global price:', error)
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t.chargePoints.title}
        subtitle={t.chargePoints.chargersFound(filtered.length)}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'table'
                ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid'
                ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-blue-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        }
      />

      {/* Global Pricing Banner */}
      <div className="card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-100 dark:border-emerald-800/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">{t.settings?.globalPricing || 'Global Pricing'}</h3>
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              {t.settings?.globalPricingDesc || 'Set a default price per kWh for all charge points on the network.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={globalPrice}
                onChange={(e) => setGlobalPrice(e.target.value)}
                placeholder="0.291"
                className="w-24 sm:w-28 pl-3 pr-8 py-2 text-sm border border-emerald-200 dark:border-emerald-700/50 rounded-lg focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">dt</span>
            </div>
            <button
              onClick={handleUpdateGlobalPrice}
              disabled={isUpdatingPrice || !globalPrice}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center min-w-[140px]"
            >
              {isUpdatingPrice ? <RefreshCw size={14} className="animate-spin" /> : (t.settings?.applyToAll || 'Apply to all')}
            </button>
            {priceUpdateSuccess && (
              <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                <Check size={18} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={handleSearch} placeholder={t.chargePoints.searchPlaceholder} className="flex-1 max-w-sm" />
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {s === 'All' ? t.common.all : (t.status[s as keyof typeof t.status] ?? s)}
            </button>
          ))}
        </div>
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Zap size={24} />} title={t.chargePoints.noChargers} description={t.chargePoints.noChargersDesc} />
        </div>
      ) : viewMode === 'table' ? (
        <ChargePointTable
          items={filtered}
          onSelect={(id) => navigate(`/charge-points/${id}`)}
          t={t}
          lastRowRef={lastRowRef as React.RefObject<HTMLTableRowElement>}
        />
      ) : (
        <ChargePointGrid
          items={filtered}
          onSelect={(id) => navigate(`/charge-points/${id}`)}
          t={t}
          lastRowRef={lastRowRef as React.RefObject<HTMLDivElement>}
        />
      )}

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && !hasNextPage && filtered.length > 0 && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-2">
          {filtered.length} {t.chargePoints.title.toLowerCase()} affichées
        </p>
      )}
    </div>
  )
}

function ChargePointTable({
  items, onSelect, t, lastRowRef
}: {
  items: ChargePoint[]
  onSelect: (id: string) => void
  t: any
  lastRowRef: React.RefObject<HTMLTableRowElement>
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.chargePoint}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.status}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">{t.chargePoints.vendorModel}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">{t.chargePoints.firmware}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">{t.chargePoints.lastSeen}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {items.map((cp, idx) => (
              <tr
                key={cp.chargePointId ?? cp.id}
                ref={idx === items.length - 1 ? lastRowRef : null}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                onClick={() => onSelect(cp.chargePointId ?? cp.id!)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap size={13} className="text-blue-500" />
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{cp.chargePointId ?? cp.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={cp.status ?? 'Offline'} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-slate-600 dark:text-slate-300">{[cp.vendor, cp.model].filter(Boolean).join(' / ') || '-'}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">{cp.firmwareVersion ?? (cp as any).firmware_version ?? '-'}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Clock size={11} />
                    {formatTimeAgo(cp.lastSeen ?? (cp as any).last_seen)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(cp.chargePointId ?? cp.id!) }}
                    className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-colors font-medium"
                  >
                    {t.common.details} {'->'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChargePointGrid({
  items, onSelect, t, lastRowRef
}: {
  items: ChargePoint[]
  onSelect: (id: string) => void
  t: any
  lastRowRef: React.RefObject<HTMLDivElement>
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((cp, idx) => (
        <div
          key={cp.chargePointId ?? cp.id}
          ref={idx === items.length - 1 ? lastRowRef : null}
          className="card card-hover p-4 cursor-pointer"
          onClick={() => onSelect(cp.chargePointId ?? cp.id!)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center">
              <Zap size={16} className="text-blue-500" />
            </div>
            <StatusBadge status={cp.status ?? 'Offline'} size="sm" />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{cp.chargePointId ?? cp.id}</p>
          {(cp.vendor || cp.model) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{[cp.vendor, cp.model].filter(Boolean).join(' ')}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-auto">
            <Clock size={10} />
            {formatTimeAgo(cp.lastSeen)}
          </div>
          {cp.firmwareVersion && (
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-1">
              <Cpu size={10} />
              <span className="font-mono">{cp.firmwareVersion}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
