import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, LayoutGrid, List, Clock, Cpu, Filter } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import SearchInput from '@/components/SearchInput'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { useChargePoints } from '@/hooks/useChargePoints'
import { formatTimeAgo } from '@/utils/formatters'
import type { ChargePoint } from '@/types'
import { useLang } from '@/contexts/LangContext'

const STATUS_OPTIONS = ['All', 'Available', 'Charging', 'Offline', 'Faulted', 'Preparing', 'Reserved', 'Unavailable']
const PAGE_SIZE = 12

export default function ChargePointsPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useChargePoints()
  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])
  const rawList: ChargePoint[] = getArray(data)

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

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilterChange = (s: string) => { setStatusFilter(s); setPage(1) }
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={t.chargePoints.title}
        subtitle={t.chargePoints.chargersFound(filtered.length)}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'table' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={search} onChange={handleSearch} placeholder={t.chargePoints.searchPlaceholder} className="flex-1 max-w-sm" />
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
        <ChargePointTable items={paginated} onSelect={(id) => navigate(`/charge-points/${id}`)} t={t} />
      ) : (
        <ChargePointGrid items={paginated} onSelect={(id) => navigate(`/charge-points/${id}`)} t={t} />
      )}

      {!isLoading && !isError && (
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      )}
    </div>
  )
}

function ChargePointTable({ items, onSelect, t }: { items: ChargePoint[]; onSelect: (id: string) => void; t: any }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.chargePoint}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.chargePoints.status}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">{t.chargePoints.vendorModel}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">{t.chargePoints.firmware}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">{t.chargePoints.lastSeen}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((cp) => (
              <tr
                key={cp.chargePointId ?? cp.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onSelect(cp.chargePointId ?? cp.id!)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Zap size={13} className="text-blue-500" />
                    </div>
                    <span className="font-medium text-slate-800">{cp.chargePointId ?? cp.id}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={cp.status ?? 'Offline'} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-slate-600">{[cp.vendor, cp.model].filter(Boolean).join(' / ') || '—'}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-slate-500 text-xs font-mono">{cp.firmwareVersion ?? (cp as any).firmware_version ?? '—'}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={11} />
                    {formatTimeAgo(cp.lastSeen ?? (cp as any).last_seen)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(cp.chargePointId ?? cp.id!) }}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    {t.common.details} →
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

function ChargePointGrid({ items, onSelect, t }: { items: ChargePoint[]; onSelect: (id: string) => void; t: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((cp) => (
        <div
          key={cp.chargePointId ?? cp.id}
          className="card card-hover p-4 cursor-pointer"
          onClick={() => onSelect(cp.chargePointId ?? cp.id!)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Zap size={16} className="text-blue-500" />
            </div>
            <StatusBadge status={cp.status ?? 'Offline'} size="sm" />
          </div>
          <p className="font-semibold text-slate-800 text-sm mb-1">{cp.chargePointId ?? cp.id}</p>
          {(cp.vendor || cp.model) && (
            <p className="text-xs text-slate-500 mb-2">{[cp.vendor, cp.model].filter(Boolean).join(' ')}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-auto">
            <Clock size={10} />
            {formatTimeAgo(cp.lastSeen)}
          </div>
          {cp.firmwareVersion && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <Cpu size={10} />
              <span className="font-mono">{cp.firmwareVersion}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
