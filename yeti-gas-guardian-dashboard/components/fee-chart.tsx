'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { FeeRow } from '@/lib/fees'
import { formatUsd } from '@/lib/fees'

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-heading font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.dataKey === 'paid' ? 'Paid' : 'Sui'}:{' '}
          <span className="font-medium text-foreground">{formatUsd(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function FeeChart({ data }: { data: FeeRow[] }) {
  return (
    <div className="glass glow-purple flex min-h-[260px] flex-col rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Fee Spending Over Time
        </h2>
        <p className="text-xs text-muted-foreground">
          Purple is what you paid on your chain(s). Green is Sui.
        </p>
      </div>
      <div className="min-h-[256px] w-full flex-1">
        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="suiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
            <Area
              type="monotone"
              dataKey="paid"
              stroke="var(--color-chart-1)"
              strokeWidth={2.5}
              fill="url(#paidGrad)"
            />
            <Area
              type="monotone"
              dataKey="sui"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
              fill="url(#suiGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
