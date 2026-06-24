'use client'

import type { PocketWatchInsights } from '@/lib/insights'
import { PersonalityBadge } from '@/components/personality-badge'
import { TopRegrets } from '@/components/top-regrets'
import { MonthlyGasDiet } from '@/components/monthly-gas-diet'
import { FeeCalendar } from '@/components/fee-calendar'
import { AlternateReality } from '@/components/alternate-reality'
import { OnchainAnalyst } from '@/components/onchain-analyst'
import { PocketWatchWrapped } from '@/components/pocketwatch-wrapped'

export function InsightsSection({ insights }: { insights: PocketWatchInsights }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">Your gas story</h2>
        <span className="text-[11px] text-muted-foreground">Estimates · shareable · unhinged</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PersonalityBadge personality={insights.personality} />
        <TopRegrets regrets={insights.topRegrets} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <MonthlyGasDiet
          months={insights.monthlyDiet}
          heaviest={insights.heaviestMonth}
          quietest={insights.quietestMonth}
        />
        <FeeCalendar days={insights.calendar} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AlternateReality estimates={insights.alternateRealities} />
        <OnchainAnalyst insights={insights} />
      </div>

      <PocketWatchWrapped insights={insights} />
    </section>
  )
}