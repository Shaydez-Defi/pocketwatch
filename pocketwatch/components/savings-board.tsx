'use client'

import { useQuery } from '@tanstack/react-query'
import { useSuiClient } from '@mysten/dapp-kit'
import { Globe2, TrendingUp, Users } from 'lucide-react'
import { fetchSavingsBoard } from '@/lib/sui'
import { formatUsd } from '@/lib/fees'

export function SavingsBoard() {
  const client = useSuiClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['savings-board'],
    queryFn: () => fetchSavingsBoard(client),
    refetchInterval: 15_000,
  })

  return (
    <div className="glass glow-green rounded-2xl border border-success/20 p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-success/15 text-success">
          <Globe2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Community Savings Board
          </h2>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Live on Sui. Running total of estimated gas everyone paid vs what the same
            activity would have cost on Sui. Potential savings, not money already saved.
          </p>
        </div>
      </div>

      {isError ? (
        <p className="text-xs text-destructive">
          Couldn&apos;t reach the onchain board. Try again shortly.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat
            icon={<TrendingUp className="size-4" aria-hidden="true" />}
            label="Community would've saved on Sui"
            value={isLoading ? '…' : formatUsd(data!.totalSavedUsd)}
            loss
          />
          <Stat
            icon={<Users className="size-4" aria-hidden="true" />}
            label="Analyses on board"
            value={isLoading ? '…' : data!.totalAnalyses.toLocaleString()}
          />
          <Stat
            icon={<TrendingUp className="size-4" aria-hidden="true" />}
            label="Largest est. difference"
            value={isLoading ? '…' : formatUsd(data!.biggestSavingUsd)}
            loss
          />
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  loss = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  loss?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <p
        className={[
          'mt-1 font-heading text-2xl font-bold tracking-tight',
          loss ? 'text-destructive' : 'text-foreground',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}
