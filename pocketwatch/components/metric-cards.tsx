'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Flame, Leaf, Loader2, PiggyBank, ShieldCheck, UploadCloud } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit'
import { formatUsd } from '@/lib/fees'
import { useCountUp } from '@/hooks/use-count-up'
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
  amount,
  hint,
  icon: Icon,
  tone,
  animate,
  staggerClass,
}: {
  label: string
  amount: number
  hint: string
  icon: LucideIcon
  tone: Tone
  animate?: boolean
  staggerClass?: string
}) {
  const t = toneMap[tone]
  const display = useCountUp(amount, !!animate)
  return (
    <div
      className={[
        `glass rounded-2xl p-6 ${t.glow} ${t.ring} transition-transform duration-300 hover:-translate-y-1`,
        animate ? `animate-results-reveal ${staggerClass ?? ''}` : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-xl ${t.iconBg}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p
        className={[
          `mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl ${t.text}`,
          animate ? 'animate-count-up' : '',
        ].join(' ')}
      >
        {formatUsd(display)}
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

  return (
    <div className="glass glow-purple rounded-2xl border border-primary/30 p-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-start gap-3">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary glow-purple sm:flex">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-foreground">
              Optional: save your analysis on Sui
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {account
                ? `Want a permanent receipt? Write this ${formatUsd(saved)} estimate to your onchain ledger and the community board.`
                : `Connect a Sui wallet if you want this analysis saved onchain. Totally optional.`}
            </p>
            {message && (
              <p
                className={`mt-2 text-xs ${
                  status === 'error' ? 'text-destructive' : 'text-success'
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        {account ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={status === 'saving'}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === 'saving' ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving to Sui…
              </>
            ) : status === 'done' ? (
              <>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Saved. Save again
              </>
            ) : (
              <>
                <UploadCloud className="size-4" aria-hidden="true" />
                Save to Sui
              </>
            )}
          </button>
        ) : (
          <div className="shrink-0 [&_button]:!rounded-xl [&_button]:!px-6 [&_button]:!py-3 [&_button]:!text-sm [&_button]:!font-semibold">
            <ConnectButton connectText="Connect Sui to save" />
          </div>
        )}
      </div>
    </div>
  )
}

export function MetricCards({
  totalPaid,
  totalSui,
  saved,
  canSave = false,
  animate = false,
}: {
  totalPaid: number
  totalSui: number
  saved: number
  canSave?: boolean
  animate?: boolean
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Total Fees Paid"
          amount={totalPaid}
          hint="Money that left your wallet as gas. The uncomfortable truth."
          icon={Flame}
          tone="red"
          animate={animate}
          staggerClass="animate-stagger-1"
        />
        <MetricCard
          label="Est. on Sui"
          amount={totalSui}
          hint="Rough estimate: same txs priced on Sui. Not a quote."
          icon={Leaf}
          tone="green"
          animate={animate}
          staggerClass="animate-stagger-2"
        />
        <MetricCard
          label="Est. Difference"
          amount={saved}
          hint="One chain comparison. Other chains may differ too. See simulator below."
          icon={PiggyBank}
          tone="purple"
          animate={animate}
          staggerClass="animate-stagger-3"
        />
      </div>
      {canSave && (
        <div className={animate ? 'animate-results-reveal animate-stagger-4' : ''}>
          <SaveToSui totalPaid={totalPaid} totalSui={totalSui} saved={saved} />
        </div>
      )}
    </section>
  )
}
