import React, { useState, useMemo } from 'react'
import { MessageSquare, Eye, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SearchInput from '@/components/SearchInput'
import Pagination from '@/components/Pagination'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import JsonViewer from '@/components/JsonViewer'
import { TableSkeleton } from '@/components/LoadingSkeleton'
import { useMessages } from '@/hooks/useMessages'
import { formatDateTime } from '@/utils/formatters'
import type { OcppMessage } from '@/types'
import { useLang } from '@/contexts/LangContext'

const PAGE_SIZE = 20

export default function MessagesPage() {
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [dirFilter, setDirFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set())
  const [viewing, setViewing] = useState<OcppMessage | null>(null)

  const { data, isLoading, isError, refetch } = useMessages()
  const getArray = (val: any) => Array.isArray(val) ? val : (Array.isArray(val?.data) ? val.data : [])
  const rawList: OcppMessage[] = getArray(data)

  const actions = useMemo(() => {
    const set = new Set(rawList.map((m) => m.action).filter(Boolean))
    return ['All', ...Array.from(set)] as string[]
  }, [rawList])

  const filtered = useMemo(() => {
    return rawList.filter((m) => {
      const matchSearch = !search ||
        m.chargePointId?.toLowerCase().includes(search.toLowerCase()) ||
        m.action?.toLowerCase().includes(search.toLowerCase())
      const dir = m.direction?.toLowerCase()
      const matchDir = dirFilter === 'All' || dir === dirFilter.toLowerCase()
      const matchAction = !actionFilter || actionFilter === 'All' || m.action === actionFilter
      return matchSearch && matchDir && matchAction
    })
  }, [rawList, search, dirFilter, actionFilter])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleExpand = (id: string | number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title={t.messages.title} subtitle={t.messages.subtitle(filtered.length)} />

      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1) }}
            placeholder={t.messages.searchPlaceholder}
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400 dark:text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {actions.map((a) => <option key={a} value={a === 'All' ? '' : a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t.messages.direction}</span>
          {['All', 'IN', 'OUT'].map((d) => (
            <button
              key={d}
              onClick={() => { setDirFilter(d); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                dirFilter.toUpperCase() === d || (dirFilter === 'All' && d === 'All')
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {d === 'All' ? t.messages.dirAll : (
                <span className={d === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {d === 'IN' ? t.messages.dirIn : t.messages.dirOut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      {isLoading ? (
        <TableSkeleton rows={10} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<MessageSquare size={22} />} title={t.messages.noMessages} description={t.messages.noMessagesDesc} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <th className="w-8 px-2 py-3" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.messages.timestamp}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.messages.chargePoint}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.messages.action}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.messages.directionCol}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">{t.messages.type}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {paginated.map((msg, idx) => {
                  const id = msg.id
                  const isOpen = expanded.has(id)
                  const dir = msg.direction?.toUpperCase()
                  return (
                    <React.Fragment key={id ? `msg-${id}` : `msg-fallback-${idx}`}>
                      <tr
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(id)}
                      >
                        <td className="px-2 py-3 text-slate-400 dark:text-slate-500">
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDateTime(msg.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-100">{msg.chargePointId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 px-2 py-0.5 rounded-md">
                            {msg.action ?? '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${dir === 'IN' ? 'badge-in' : dir === 'OUT' ? 'badge-out' : 'badge-offline'}`}>
                            {dir === 'IN' ? t.messages.dirIn : dir === 'OUT' ? t.messages.dirOut : dir ?? '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-400 dark:text-slate-500">
                          {msg.messageType != null ? t.messages.messageType(msg.messageType) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewing(msg) }}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="px-4 pb-3 pt-0 bg-slate-50 dark:bg-slate-800/70">
                            <JsonViewer data={msg.payload ?? msg.rawMessage ?? msg} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

      {viewing && (
        <JsonViewer
          data={viewing.payload ?? viewing.rawMessage ?? viewing}
          title={`Message Payload - ${viewing.action ?? 'OCPP'} | ${viewing.chargePointId}`}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  )
}
