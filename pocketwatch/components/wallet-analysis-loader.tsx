'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { WALLET_ANALYSIS_STAGES } from '@/lib/loading-messages'
import { ChartSkeleton, MetricsSkeleton } from '@/components/loading-skeleton'

export function WalletAnalysisLoader() {
  const [stageIndex, setStageIndex] = useState(0)
  const [progress, setProgress] = useState<number>(WALLET_ANALYSIS_STAGES[0].progress)

  useEffect(() => {
    setStageIndex(0)
    setProgress(WALLET_ANALYSIS_STAGES[0].progress)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = Math.min(prev + 1, WALLET_ANALYSIS_STAGES.length - 1)
        setProgress(WALLET_ANALYSIS_STAGES[next].progress)
        return next
      })
    }, 2200)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      setProgress((p) => {
        const cap = WALLET_ANALYSIS_STAGES[stageIndex].progress + 8
        return p < cap ? p + 0.4 : p
      })
    }, 80)
    return () => clearInterval(tick)
  }, [stageIndex])

  const stage = WALLET_ANALYSIS_STAGES[stageIndex]

  return (
    <div className="flex flex-col gap-8" aria-live="polite" aria-busy="true" role="status">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/20 p-6 sm:p-10">
        <div
          className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <Image
            src="/yeti-guardian.png"
            alt=""
            width={120}
            height={120}
            className="size-24 shrink-0 animate-yeti-float opacity-80 sm:size-28"
          />
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                Scanning your wallets
              </p>
              <p
                key={stage.label}
                className="mt-2 font-heading text-xl font-bold text-foreground animate-message-in sm:text-2xl"
              >
                {stage.label}
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-secondary/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress, 98)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Stage {stageIndex + 1} of {WALLET_ANALYSIS_STAGES.length}</span>
                <span>{Math.round(Math.min(progress, 98))}%</span>
              </div>
            </div>

            <ul className="hidden flex-wrap gap-2 sm:flex">
              {WALLET_ANALYSIS_STAGES.map((s, i) => (
                <li
                  key={s.label}
                  className={[
                    'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all duration-300',
                    i < stageIndex
                      ? 'border-success/30 bg-success/10 text-success'
                      : i === stageIndex
                        ? 'border-primary/40 bg-primary/15 text-primary'
                        : 'border-border/60 bg-secondary/30 text-muted-foreground',
                  ].join(' ')}
                >
                  {s.label.replace(/\.\.\.$/, '')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <MetricsSkeleton animated />
      <ChartSkeleton animated />
    </div>
  )
}