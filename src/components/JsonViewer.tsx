import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'

interface JsonViewerProps {
  data: unknown
  title?: string
  onClose?: () => void
}

function highlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'text-blue-300'
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'text-slate-200' : 'text-emerald-300'
        } else if (/true|false/.test(match)) {
          cls = 'text-amber-300'
        } else if (/null/.test(match)) {
          cls = 'text-rose-300'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
}

export default function JsonViewer({ data, title, onClose }: JsonViewerProps) {
  const { t } = useLang()
  const displayTitle = title ?? t.common.payload
  const [copied, setCopied] = useState(false)

  const jsonStr = JSON.stringify(data, null, 2)
  const highlighted = highlight(jsonStr)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!onClose) {
    return (
      <pre
        className="text-xs leading-relaxed overflow-auto p-4 rounded-lg bg-slate-900 text-slate-300"
        style={{ maxHeight: '300px' }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        style={{ background: '#0d1526' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-white font-semibold text-sm">{displayTitle}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                color: copied ? '#10b981' : '#94a3b8',
              }}
            >
              {copied ? t.common.copied : t.common.copyJson}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <pre
          className="text-xs leading-relaxed overflow-auto p-5 text-slate-300"
          style={{ maxHeight: '60vh' }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  )
}
