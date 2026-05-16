import { Search, X } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder, className = '' }: SearchInputProps) {
  const { t } = useLang()
  const displayPlaceholder = placeholder ?? t.common.search
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={15} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
