'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarRange } from 'lucide-react'
import { formatUsd } from '@/lib/fees'
import type { MonthlySpend } from '@/lib/insights'

export function MonthlyGasDiet({
  months,
  heaviest,
  quietest,
}: {
  months: MonthlySpend[]
  heaviest: MonthlySpend | null
  quietest: MonthlySpend | null
}) {
  if (!months.length) return null

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-warning/15 text-warning">
          <CalendarRange className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Monthly Gas Diet</h2>
          <p className="text-[11px] text-muted-foreground">Heavy months vs quiet months</p>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {heaviest && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Heaviest · </span>
            <span className="font-semibold text-destructive">
              {heaviest.label} · {formatUsd(heaviest.total)}
            </span>
          </div>
        )}
        {quietest && quietest.month !== heaviest?.month && (
          <div className="rounded-xl border border-success/25 bg-success/5 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Quietest · </span>
            <span className="font-semibold text-success">
              {quietest.label} · {formatUsd(quietest.total)}
            </span>
          </div>
        )}
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              cursor={{ fill: 'var(--secondary)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload as MonthlySpend
                return (
                  <div className="glass rounded-lg px-3 py-2 text-xs">
                    <p className="font-semibold">{d.label}</p>
                    <p>{formatUsd(d.total)} · {d.txCount} txs</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="total" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}