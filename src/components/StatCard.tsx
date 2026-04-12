interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'default'
  trend?: { value: number; label: string }
}

const VARIANT_STYLES = {
  blue:    { bg: 'stat-card-gradient-blue',    icon: 'text-blue-600',    iconBg: 'bg-blue-100'    },
  emerald: { bg: 'stat-card-gradient-emerald', icon: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  amber:   { bg: 'stat-card-gradient-amber',   icon: 'text-amber-600',   iconBg: 'bg-amber-100'   },
  rose:    { bg: 'stat-card-gradient-rose',    icon: 'text-rose-600',    iconBg: 'bg-rose-100'    },
  default: { bg: '',                           icon: 'text-slate-600',   iconBg: 'bg-slate-100'   },
}

export default function StatCard({ title, value, subtitle, icon, variant = 'default', trend }: StatCardProps) {
  const s = VARIANT_STYLES[variant]

  return (
    <div className={`card card-hover animate-fade-in p-5 ${s.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} ${s.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
