'use client'

import type { Personality } from '@/lib/insights'

export function PersonalityBadge({ personality }: { personality: Personality }) {
  return (
    <div className="glass glow-purple rounded-2xl p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Chain personality
      </p>
      <div className="mt-4 flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-3xl">
          {personality.icon}
        </span>
        <div>
          <h3 className="font-heading text-xl font-bold text-foreground">
            {personality.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {personality.description}
          </p>
          <p className="mt-3 text-xs text-primary">
            {personality.confidence}% confidence · vibes-based, not science
          </p>
        </div>
      </div>
    </div>
  )
}