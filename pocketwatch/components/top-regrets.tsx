'use client'

import { Skull } from 'lucide-react'
import { formatUsd } from '@/lib/fees'
import type { RegretItem } from '@/lib/insights'

export function TopRegrets({ regrets }: { regrets: RegretItem[] }) {
  if (!regrets.length) return null

  return (
    <div className="glass glow-red rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
          <Skull className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Top Regrets</h2>
          <p className="text-[11px] text-muted-foreground">Your most expensive gas moments</p>
        </div>
      </div>
      <ul className="space-y-3">
        {regrets.map((r, i) => (
          <li
            key={`${r.date}-${r.chain}-${i}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-heading text-lg font-bold text-destructive">
                {formatUsd(r.paid)}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.chain} · {r.date}
              </p>
              <p className="mt-1 text-xs italic text-foreground/80">{r.quip}</p>
            </div>
            <span className="shrink-0 font-heading text-2xl font-bold text-muted-foreground/40">
              #{i + 1}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}