interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  noPadding?: boolean
}

export default function ChartCard({ title, subtitle, children, action, className = '', noPadding }: ChartCardProps) {
  return (
    <div className={`card animate-fade-in ${className}`}>
      <div className={`flex items-center justify-between gap-3 ${noPadding ? 'px-5 pt-5 pb-4' : 'px-5 pt-5 pb-3'}`}>
        <div>
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className={noPadding ? '' : 'px-1 pb-4'}>
        {children}
      </div>
    </div>
  )
}
