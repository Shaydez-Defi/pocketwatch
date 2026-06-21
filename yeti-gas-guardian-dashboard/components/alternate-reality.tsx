'use client'

import { GitBranch } from 'lucide-react'
import { formatUsd } from '@/lib/fees'
import type { AlternateEstimate } from '@/lib/insights'

export function AlternateReality({ estimates }: { estimates: AlternateEstimate[] }) {
  if (!estimates.length) return null

  const max = Math.max(...estimates.map((e) => e.estimatedTotal), 0.01)

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <GitBranch className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Alternate Reality Simulator
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Est. same activity on other chains — not exact quotes
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {estimates.map((e) => (
          <li key={e.chain}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{e.chain}</span>
              <span className="text-muted-foreground">
                ~{formatUsd(e.estimatedTotal)}
                {e.estimatedSavings > 0 && (
                  <span className="ml-2 text-success">
                    (−{formatUsd(e.estimatedSavings)} est.)
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary/50">
              <div
                className="h-full rounded-full bg-primary/70 transition-all duration-500"
                style={{ width: `${Math.max(4, (e.estimatedTotal / max) * 100)}%` }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              ~{formatUsd(e.perTxEstimate)}/tx estimate
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}