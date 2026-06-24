'use client'

import { useMemo } from 'react'
import { MessageCircleHeart } from 'lucide-react'
import { formatUsd } from '@/lib/fees'
import { pickYetiQuip } from '@/lib/yeti-voice'
import type { PocketWatchInsights } from '@/lib/insights'

function pickTip(saved: number): string {
  if (saved <= 0) {
    return "Omo, your records dey clean! No wasted gas here. The Yeti dey proud of you, no cap."
  }
  if (saved < 50) {
    return `Small small loss: ${formatUsd(saved)} just waka commot. That one na suya money, abeg take am easy next time.`
  }
  if (saved < 200) {
    return `Chai! ${formatUsd(saved)} don disappear for gas. That one fit don buy correct jollof and chicken o.`
  }
  if (saved < 500) {
    return `Ah ahn! ${formatUsd(saved)} gone? My friend, that money for don pay your light bill for the whole year. E pain me die.`
  }
  return `Walahi, ${formatUsd(saved)}?! That na full rent money you flush down the drain. The Yeti don enter parlour, sit down, dey reason your life choices.`
}

export function YetiTip({
  saved,
  insights,
}: {
  saved: number
  insights: PocketWatchInsights | null
}) {
  const quip = useMemo(() => pickYetiQuip(insights, saved), [insights, saved])
  const tip = insights ? quip : pickTip(saved)

  return (
    <section className="glass glow-purple relative overflow-hidden rounded-2xl p-6">
      <div
        className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary glow-purple">
          <MessageCircleHeart className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading text-sm font-bold text-primary">Yeti says</p>
          <p className="mt-1 text-pretty text-base leading-relaxed text-foreground/90">
            {tip}
          </p>
          {insights && (
            <p className="mt-2 text-xs text-muted-foreground">
              {insights.personality.icon} {insights.personality.title} ·{' '}
              {insights.txCount} txs · est. {formatUsd(insights.saved)} elsewhere
            </p>
          )}
        </div>
      </div>
    </section>
  )
}