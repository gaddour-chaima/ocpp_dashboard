import { getStatusColor } from '@/utils/status'

interface StatusBadgeProps {
  status: string
  dot?: boolean
  size?: 'sm' | 'md'
}

const STATUS_DOTS: Record<string, string> = {
  Available:    '#10b981',
  Charging:     '#3b82f6',
  Preparing:    '#8b5cf6',
  Finishing:    '#8b5cf6',
  SuspendedEVSE:'#f59e0b',
  SuspendedEV:  '#f59e0b',
  Reserved:     '#f59e0b',
  Unavailable:  '#94a3b8',
  Faulted:      '#f43f5e',
  Offline:      '#64748b',
  active:       '#10b981',
  completed:    '#64748b',
  stopped:      '#f59e0b',
  error:        '#f43f5e',
}

export default function StatusBadge({ status, dot = true, size = 'md' }: StatusBadgeProps) {
  const dotColor = STATUS_DOTS[status] ?? '#94a3b8'
  const badgeClass = getStatusColor(status)
  const sizeClass = size === 'sm' ? 'text-[11px] py-0.5 px-2' : ''

  return (
    <span className={`badge ${badgeClass} ${sizeClass}`}>
      {dot && (
        <span
          className="inline-block rounded-full w-1.5 h-1.5 flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {status}
    </span>
  )
}
