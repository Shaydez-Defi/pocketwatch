export function MetricsSkeleton({ animated = false }: { animated?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={[
            'glass rounded-2xl p-6',
            animated ? 'animate-skeleton-shimmer' : 'animate-pulse',
          ].join(' ')}
          style={animated ? { animationDelay: `${(i - 1) * 120}ms` } : undefined}
        >
          <div className="h-4 w-24 rounded bg-secondary/80" />
          <div className="mt-6 h-10 w-32 rounded bg-secondary/60" />
          <div className="mt-3 h-3 w-full rounded bg-secondary/40" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ animated = false }: { animated?: boolean }) {
  return (
    <div
      className={[
        'glass min-h-[260px] rounded-2xl p-6',
        animated ? 'animate-skeleton-shimmer' : 'animate-pulse',
      ].join(' ')}
    >
      <div className="mb-4 h-5 w-48 rounded bg-secondary/80" />
      <div className="flex h-56 items-end gap-2 rounded-xl bg-secondary/20 px-4 pb-4">
        {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-secondary/50 animate-skeleton-bar"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}