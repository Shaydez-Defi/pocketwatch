'use client'

import { useMemo, useState } from 'react'
import { TopNav } from '@/components/top-nav'
import { Hero } from '@/components/hero'
import { MetricCards } from '@/components/metric-cards'
import { SavingsBoard } from '@/components/savings-board'
import { FeeChart } from '@/components/fee-chart'
import { CsvUpload } from '@/components/csv-upload'
import { WalletPanel } from '@/components/wallet-panel'
import { YetiTip } from '@/components/yeti-tip'
import { sampleFeeData, summarize, type FeeRow } from '@/lib/fees'

export function Dashboard() {
  const [data, setData] = useState<FeeRow[]>(sampleFeeData)
  const [sourceLabel, setSourceLabel] = useState<string | null>(null)
  const [pricing, setPricing] = useState(false)

  const { totalPaid, totalSui, saved } = useMemo(() => summarize(data), [data])

  function resetToSample() {
    setData(sampleFeeData)
    setSourceLabel(null)
  }

  return (
    <div className="page-aurora min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10">
        <Hero />
        <div
          key={`metrics-${sourceLabel ?? 'sample'}`}
          className={`animate-fade-in-up transition-opacity duration-300 ${
            pricing ? 'opacity-60' : 'opacity-100'
          }`}
        >
          <MetricCards
            totalPaid={totalPaid}
            totalSui={totalSui}
            saved={saved}
            canSave={sourceLabel !== null}
          />
        </div>
        <SavingsBoard />
        <div className="flex flex-col gap-5">
          <div
            key={`chart-${sourceLabel ?? 'sample'}`}
            className={`animate-fade-in-up transition-opacity duration-300 ${
              pricing ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <FeeChart data={data} />
          </div>
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
        </div>
        <YetiTip saved={saved} />
        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          PocketWatch — built for late nights and lighter wallets.
        </footer>
      </main>
    </div>
  )
}