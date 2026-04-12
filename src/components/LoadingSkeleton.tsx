interface LoadingSkeletonProps {
  rows?: number
  className?: string
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="h-2.5 w-20" />
        </div>
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-100">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-5 w-16 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="px-5 pb-5">
      <SkeletonBlock className="rounded-lg w-full" style={{ height: `${height}px` } as React.CSSProperties} />
    </div>
  )
}

export default function LoadingSkeleton({ rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}
