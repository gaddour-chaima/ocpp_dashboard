import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export default function ErrorState({
  title,
  message,
  onRetry,
}: ErrorStateProps) {
  const { t } = useLang()
  const displayTitle = title ?? t.common.errorLoadData
  const displayMessage = message ?? t.common.errorConnection

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-rose-500" />
      </div>
      <p className="text-slate-800 font-semibold text-base mb-1">{displayTitle}</p>
      <p className="text-slate-400 text-sm max-w-xs mb-4">{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} />
          {t.common.retry}
        </button>
      )}
    </div>
  )
}
