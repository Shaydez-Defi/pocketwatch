'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Flame, Leaf, Loader2, PiggyBank, UploadCloud } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit'
import { formatUsd } from '@/lib/fees'
import {
  buildCreateLedgerTx,
  buildSaveAnalysisTx,
  loadLedgerId,
  storeLedgerId,
  MODULE,
} from '@/lib/sui'

type Tone = 'red' | 'green' | 'purple'

const toneMap: Record<
  Tone,
  { glow: string; ring: string; text: string; iconBg: string }
> = {
  red: {
    glow: 'glow-red',
    ring: 'border-destructive/30',
    text: 'text-destructive',
    iconBg: 'bg-destructive/15 text-destructive',
  },
  green: {
    glow: 'glow-green',
    ring: 'border-success/30',
    text: 'text-success',
    iconBg: 'bg-success/15 text-success',
  },
  purple: {
    glow: 'glow-purple',
    ring: 'border-primary/30',
    text: 'text-primary text-glow',
    iconBg: 'bg-primary/15 text-primary',
  },
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: Tone
}) {
  const t = toneMap[tone]
  return (
    <div
      className={`glass rounded-2xl p-6 ${t.glow} ${t.ring} transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-xl ${t.iconBg}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className={`mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl ${t.text}`}>
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  )
}

function SaveToSui({
  totalPaid,
  totalSui,
  saved,
}: {
  totalPaid: number
  totalSui: number
  saved: number
}) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const queryClient = useQueryClient()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function ensureLedgerId(): Promise<string> {
    const existing = loadLedgerId()
    if (existing) return existing

    const { digest } = await signAndExecute({ transaction: buildCreateLedgerTx() })
    const { objectChanges } = await client.waitForTransaction({
      digest,
      options: { showObjectChanges: true },
    })

    const created = objectChanges?.find(
      (change) =>
        change.type === 'created' &&
        change.objectType.includes(`::${MODULE}::FeeLedger`),
    )

    if (!created || created.type !== 'created') {
      throw new Error('Ledger was created but its object id could not be read.')
    }

    storeLedgerId(created.objectId)
    return created.objectId
  }

  async function handleSave() {
    setStatus('saving')
    setMessage(null)
    try {
      const ledgerId = await ensureLedgerId()
      const { digest } = await signAndExecute({
        transaction: buildSaveAnalysisTx(ledgerId, totalPaid, totalSui, saved),
      })
      await client.waitForTransaction({ digest })
      queryClient.invalidateQueries({ queryKey: ['savings-board'] })
      setStatus('done')
      setMessage(`Saved on Sui · ${digest.slice(0, 10)}…`)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Could not save to Sui.')
    }
  }

  if (!account) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Connect your Sui wallet (top right) to save this analysis on-chain.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={status === 'saving'}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === 'saving' ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving to Sui…
          </>
        ) : status === 'done' ? (
          <>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Saved to Sui
          </>
        ) : (
          <>
            <UploadCloud className="size-4" aria-hidden="true" />
            Save to Sui
          </>
        )}
      </button>
      {message && (
        <p
          className={`text-center text-xs ${
            status === 'error' ? 'text-destructive' : 'text-success'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}

export function MetricCards({
  totalPaid,
  totalSui,
  saved,
  canSave = false,
}: {
  totalPaid: number
  totalSui: number
  saved: number
  canSave?: boolean
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Total Fees Paid"
          value={formatUsd(totalPaid)}
          hint="What your chains actually charged in gas. Ouch."
          icon={Flame}
          tone="red"
        />
        <MetricCard
          label="Sui Would've Charged"
          value={formatUsd(totalSui)}
          hint="The same transactions, settled on Sui. Pocket change."
          icon={Leaf}
          tone="green"
        />
        <MetricCard
          label="You Would've Saved"
          value={formatUsd(saved)}
          hint="Money the Yeti wishes you still had."
          icon={PiggyBank}
          tone="purple"
        />
      </div>
      {canSave && (
        <SaveToSui totalPaid={totalPaid} totalSui={totalSui} saved={saved} />
      )}
    </section>
  )
}
