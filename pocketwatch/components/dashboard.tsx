'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { TopNav } from '@/components/top-nav'
import { ShockHero } from '@/components/shock-hero'
import { MetricCards } from '@/components/metric-cards'
import { FeeChart } from '@/components/fee-chart'
import { CsvUpload } from '@/components/csv-upload'
import { WalletPanel } from '@/components/wallet-panel'
import { YetiTip } from '@/components/yeti-tip'
import { InsightsSection } from '@/components/insights-section'
import { ChartSkeleton, MetricsSkeleton } from '@/components/loading-skeleton'
import { WalletAnalysisLoader } from '@/components/wallet-analysis-loader'
import { sampleFeeData, summarize, type FeeRow } from '@/lib/fees'
import { buildInsights } from '@/lib/insights'

type AnalysisSource = 'wallet' | 'csv' | null

export function Dashboard() {
  const [data, setData] = useState<FeeRow[]>(sampleFeeData)
  const [sourceLabel, setSourceLabel] = useState<string | null>(null)
  const [pricing, setPricing] = useState(false)
  const [analysisSource, setAnalysisSource] = useState<AnalysisSource>(null)
  const [revealResults, setRevealResults] = useState(false)

  const analysisRef = useRef<HTMLDivElement>(null)
  const pendingWalletScrollRef = useRef(false)
  const wasPricingRef = useRef(false)

  const hasRealData = sourceLabel !== null
  const { totalPaid, totalSui, saved } = useMemo(() => summarize(data), [data])
  const insights = useMemo(
    () => (hasRealData ? buildInsights(data) : null),
    [data, hasRealData],
  )

  function resetToSample() {
    setData(sampleFeeData)
    setSourceLabel(null)
    setAnalysisSource(null)
    setRevealResults(false)
    pendingWalletScrollRef.current = false
  }

  function handleAnalysisStart(source: AnalysisSource) {
    setAnalysisSource(source)
    setRevealResults(false)
    if (source === 'wallet') pendingWalletScrollRef.current = true
  }

  function handleAnalysisData(rows: FeeRow[], label: string) {
    setData(rows)
    setSourceLabel(label)
  }

  useEffect(() => {
    if (wasPricingRef.current && !pricing && hasRealData) {
      setRevealResults(true)
    }
    wasPricingRef.current = pricing
  }, [pricing, hasRealData])

  useEffect(() => {
    if (pricing || !hasRealData || !pendingWalletScrollRef.current) return
    if (analysisSource !== 'wallet') {
      pendingWalletScrollRef.current = false
      return
    }

    pendingWalletScrollRef.current = false

    const frame = requestAnimationFrame(() => {
      const el = analysisRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const headerOffset = 96
      const alreadyNearTop = rect.top >= headerOffset - 24 && rect.top <= headerOffset + 80

      if (!alreadyNearTop) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [pricing, hasRealData, analysisSource, sourceLabel])

  const showWalletLoader = pricing && analysisSource === 'wallet'
  const showCsvLoader = pricing && analysisSource === 'csv'

  return (
    <div className="page-aurora min-h-screen">
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10">
        <section
          ref={analysisRef}
          id="analysis-results"
          className="scroll-mt-24 flex flex-col gap-10"
        >
          {showWalletLoader ? (
            <WalletAnalysisLoader />
          ) : (
            <>
              {hasRealData ? (
                <ShockHero
                  key={`hero-${sourceLabel}`}
                  insights={insights}
                  hasRealData={hasRealData}
                  animate={revealResults}
                />
              ) : (
                <ShockHero insights={insights} hasRealData={hasRealData} />
              )}

              {showCsvLoader ? (
                <MetricsSkeleton animated />
              ) : hasRealData ? (
                <MetricCards
                  key={`metrics-${sourceLabel}`}
                  totalPaid={totalPaid}
                  totalSui={totalSui}
                  saved={saved}
                  canSave={hasRealData}
                  animate={revealResults}
                />
              ) : (
                <MetricCards
                  totalPaid={totalPaid}
                  totalSui={totalSui}
                  saved={saved}
                  canSave={false}
                />
              )}

              {showCsvLoader ? (
                <ChartSkeleton animated />
              ) : (
                <div
                  key={`chart-${sourceLabel ?? 'sample'}`}
                  className={revealResults && hasRealData ? 'animate-results-reveal animate-stagger-4' : ''}
                >
                  <FeeChart data={data} hasRealData={hasRealData} />
                </div>
              )}

              {insights && !pricing && (
                <div
                  key={`insights-${sourceLabel}`}
                  className={revealResults ? 'animate-results-reveal animate-stagger-5' : ''}
                >
                  <InsightsSection insights={insights} />
                </div>
              )}
            </>
          )}
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <WalletPanel
            loading={pricing}
            onLoading={(loading) => {
              if (loading) handleAnalysisStart('wallet')
              setPricing(loading)
            }}
            activeLabel={sourceLabel}
            onData={handleAnalysisData}
          />
          <CsvUpload
            fileName={sourceLabel?.includes('.csv') ? sourceLabel : null}
            loading={pricing}
            onLoading={(loading) => {
              if (loading) handleAnalysisStart('csv')
              setPricing(loading)
            }}
            onData={handleAnalysisData}
            onReset={resetToSample}
          />
        </div>

        <YetiTip saved={saved} insights={insights} />
        <footer className="pb-4 pt-2 text-center text-xs text-muted-foreground">
          PocketWatch · where did your onchain money go?
        </footer>
      </main>
    </div>
  )
}