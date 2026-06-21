export function MetricsSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass animate-pulse rounded-2xl p-6">
          <div className="h-4 w-24 rounded bg-secondary/80" />
          <div className="mt-6 h-10 w-32 rounded bg-secondary/60" />
          <div className="mt-3 h-3 w-full rounded bg-secondary/40" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="glass min-h-[260px] animate-pulse rounded-2xl p-6">
      <div className="mb-4 h-5 w-48 rounded bg-secondary/80" />
      <div className="h-56 rounded-xl bg-secondary/40" />
    </div>
  )
}