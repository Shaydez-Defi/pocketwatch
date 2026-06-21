'use client'

import { useMemo, useState } from 'react'
import { TopNav } from '@/components/top-nav'
import { ShockHero } from '@/components/shock-hero'
import { MetricCards } from '@/components/metric-cards'
import { SavingsBoard } from '@/components/savings-board'
import { FeeChart } from '@/components/fee-chart'
import { CsvUpload } from '@/components/csv-upload'
import { WalletPanel } from '@/components/wallet-panel'
import { YetiTip } from '@/components/yeti-tip'
import { InsightsSection } from '@/components/insights-section'
import { ChartSkeleton, MetricsSkeleton } from '@/components/loading-skeleton'
import { sampleFeeData, summarize, type FeeRow } from '@/lib/fees'
import { buildInsights } from '@/lib/insights'

export function Dashboard() {
  const [data, setData] = useState<FeeRow[]>(sampleFeeData)
  const [sourceLabel, setSourceLabel] = useState<string | null>(null)
  const [pricing, setPricing] = useState(false)

  const hasRealData = sourceLabel !== null
  const { totalPaid, totalSui, saved } = useMemo(() => summarize(data), [data])
  const insights = useMemo(
    () => (hasRealData ? buildInsights(data) : null),
    [data, hasRealData],
  )

  function resetToSample() {
    setData(sampleFeeData)
    setSourceLabel(null)
  }

  return (
    <div className="page-aurora min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10">
        <ShockHero insights={insights} hasRealData={hasRealData} loading={pricing} />

        <SavingsBoard />

        {pricing ? (
          <MetricsSkeleton />
        ) : (
          <div
            key={`metrics-${sourceLabel ?? 'sample'}`}
            className="animate-fade-in-up"
          >
            <MetricCards
              totalPaid={totalPaid}
              totalSui={totalSui}
              saved={saved}
              canSave={hasRealData}
            />
          </div>
        )}

        {pricing ? (
          <ChartSkeleton />
        ) : (
          <div key={`chart-${sourceLabel ?? 'sample'}`} className="animate-fade-in-up">
            <FeeChart data={data} hasRealData={hasRealData} />
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <WalletPanel
            loading={pricing}
            onLoading={setPricing}
            activeLabel={sourceLabel}
            onData={(rows, label) => {
              setData(rows)
              setSourceLabel(label)
            }}
          />
          <CsvUpload
            fileName={sourceLabel?.includes('.csv') ? sourceLabel : null}
            loading={pricing}
            onLoading={setPricing}
            onData={(rows, name) => {
              setData(rows)
              setSourceLabel(name)
            }}
            onReset={resetToSample}
          />
        </div>

        {insights && !pricing && (
          <div className="animate-fade-in-up">
            <InsightsSection insights={insights} />
          </div>
        )}

        <YetiTip saved={saved} insights={insights} />
        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          PocketWatch — where did your onchain money go?
        </footer>
      </main>
    </div>
  )
}