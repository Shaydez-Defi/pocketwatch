'use client'

import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { formatUsd } from '@/lib/fees'
import type { PocketWatchInsights } from '@/lib/insights'

export function ShockHero({
  insights,
  hasRealData,
  loading,
}: {
  insights: PocketWatchInsights | null
  hasRealData: boolean
  loading: boolean
}) {
  if (!hasRealData || !insights) {
    return (
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="relative flex justify-center md:justify-start">
          <div
            className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-3xl animate-glow-pulse"
            aria-hidden="true"
          />
          <Image
            src="/yeti-guardian.png"
            alt="PocketWatch Yeti mascot"
            width={360}
            height={360}
            priority
            className="relative z-10 w-56 animate-yeti-float drop-shadow-2xl sm:w-72 md:w-[22rem]"
          />
        </div>
        <div className="flex flex-col gap-5 text-center md:text-left">
          <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:mx-0">
            <Sparkles className="size-3.5" aria-hidden="true" />
            your onchain money mirror
          </span>
          <h1 className="text-balance font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Where did your{' '}
            <span className="text-primary text-glow">onchain money</span> go?
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Connect wallets or drop a CSV. PocketWatch pulls real gas history,
            prices it per day, and shows you the uncomfortable truth — with
            personality, humor, and shareable receipts.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-destructive/25 bg-gradient-to-br from-destructive/10 via-background to-primary/10 p-6 sm:p-10 ${loading ? 'opacity-70' : ''}`}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-destructive/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-destructive">
            The number you didn&apos;t want to see
          </p>
          <p className="font-heading text-5xl font-bold tracking-tight text-destructive sm:text-6xl lg:text-7xl">
            {formatUsd(insights.totalPaid)}
          </p>
          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            That&apos;s what left your wallet as gas across{' '}
            <span className="font-semibold text-foreground">{insights.txCount}</span>{' '}
            transactions. Not investments. Not swaps. Just… gone.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <EstimatePill
              label="Est. on Sui"
              value={formatUsd(insights.totalSui)}
              tone="green"
            />
            <EstimatePill
              label="Est. difference"
              value={formatUsd(insights.saved)}
              tone="purple"
            />
            <EstimatePill
              label="Main chain"
              value={insights.favoriteChain}
              tone="neutral"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            All chain comparisons are estimates — not financial advice, not exact quotes.
          </p>
        </div>
        <div className="hidden lg:block">
          <Image
            src="/yeti-guardian.png"
            alt=""
            width={200}
            height={200}
            className="animate-yeti-float opacity-90"
          />
        </div>
      </div>
    </section>
  )
}

function EstimatePill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'green' | 'purple' | 'neutral'
}) {
  const styles = {
    green: 'border-success/30 bg-success/10 text-success',
    purple: 'border-primary/30 bg-primary/10 text-primary',
    neutral: 'border-border bg-secondary/40 text-foreground',
  }
  return (
    <div className={`rounded-xl border px-4 py-2.5 ${styles[tone]}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="font-heading text-sm font-bold">{value}</p>
    </div>
  )
}