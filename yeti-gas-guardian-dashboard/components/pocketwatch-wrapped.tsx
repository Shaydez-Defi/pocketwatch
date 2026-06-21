'use client'

import { useRef, useState } from 'react'
import { Copy, Download, Share2, Sparkles } from 'lucide-react'
import { formatUsd } from '@/lib/fees'
import {
  buildShareTweet,
  buildWrappedCaption,
  type PocketWatchInsights,
} from '@/lib/insights'

export function PocketWatchWrapped({ insights }: { insights: PocketWatchInsights }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  async function copyText() {
    await navigator.clipboard.writeText(buildWrappedCaption(insights))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadCard() {
    const el = cardRef.current
    if (!el) return

    const canvas = document.createElement('canvas')
    const scale = 2
    const w = 400
    const h = 520
    canvas.width = w * scale
    canvas.height = h * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(scale, scale)
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a1030')
    grad.addColorStop(1, '#0f0f1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#c4b5fd'
    ctx.font = 'bold 22px system-ui'
    ctx.fillText('PocketWatch Wrapped', 24, 48)

    ctx.fillStyle = '#f87171'
    ctx.font = 'bold 42px system-ui'
    ctx.fillText(formatUsd(insights.totalPaid), 24, 110)
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '14px system-ui'
    ctx.fillText('total gas spent', 24, 132)

    const lines = [
      `${insights.txCount} transactions`,
      `Top chain: ${insights.favoriteChain}`,
      `Personality: ${insights.personality.icon} ${insights.personality.title}`,
      `Biggest regret: ${formatUsd(insights.topRegrets[0]?.paid ?? 0)}`,
      `Est. savings elsewhere: ~${formatUsd(insights.saved)}`,
    ]
    ctx.fillStyle = '#e4e4e7'
    ctx.font = '15px system-ui'
    lines.forEach((line, i) => ctx.fillText(line, 24, 180 + i * 36))

    ctx.fillStyle = '#71717a'
    ctx.font = '12px system-ui'
    ctx.fillText('Where did your onchain money go?', 24, h - 32)

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'pocketwatch-wrapped.png'
    a.click()
  }

  return (
    <div className="glass glow-purple overflow-hidden rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">PocketWatch Wrapped</h2>
          <p className="text-[11px] text-muted-foreground">Screenshot-ready · mobile-first</p>
        </div>
      </div>

      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-background to-destructive/10 p-6"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Your year in gas</p>
        <p className="mt-2 font-heading text-4xl font-bold text-destructive sm:text-5xl">
          {formatUsd(insights.totalPaid)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">vanished into validators&apos; pockets</p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Stat label="Transactions" value={String(insights.txCount)} />
          <Stat label="Top chain" value={insights.favoriteChain} />
          <Stat
            label="Personality"
            value={`${insights.personality.icon} ${insights.personality.title}`}
          />
          <Stat
            label="Est. savings"
            value={`~${formatUsd(insights.saved)}`}
          />
        </div>

        {insights.topRegrets[0] && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Biggest regret: {formatUsd(insights.topRegrets[0].paid)} on{' '}
            {insights.topRegrets[0].chain} — {insights.topRegrets[0].quip}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionBtn icon={Copy} label={copied ? 'Copied!' : 'Copy'} onClick={copyText} />
        <ActionBtn icon={Download} label="Download" onClick={downloadCard} />
        <a
          href={buildShareTweet(insights)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
        >
          <Share2 className="size-3.5" />
          Share to X
        </a>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-heading text-sm font-bold text-foreground">{value}</p>
    </div>
  )
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Copy
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}