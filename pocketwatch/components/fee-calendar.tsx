'use client'

import { Grid3x3 } from 'lucide-react'
import { formatUsd } from '@/lib/fees'
import type { CalendarDay } from '@/lib/insights'

const LEVEL_CLASS: Record<CalendarDay['level'], string> = {
  0: 'bg-secondary/30',
  1: 'bg-primary/20',
  2: 'bg-primary/35',
  3: 'bg-primary/55',
  4: 'bg-primary/80',
}

export function FeeCalendar({ days }: { days: CalendarDay[] }) {
  if (!days.length) return null

  const recent = days.slice(-84)

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Grid3x3 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Fee Calendar</h2>
          <p className="text-[11px] text-muted-foreground">Gas activity heatmap</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {recent.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${formatUsd(day.amount)}`}
            className={`size-3 rounded-sm ${LEVEL_CLASS[day.level]} transition-transform hover:scale-125`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <div key={l} className={`size-3 rounded-sm ${LEVEL_CLASS[l]}`} />
          ))}
        </div>
        <span>More gas</span>
      </div>
    </div>
  )
}