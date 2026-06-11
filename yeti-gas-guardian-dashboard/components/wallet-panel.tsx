'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2, Wallet, Zap } from 'lucide-react'
import { useWallets } from '@/components/wallet-provider'
import {
  detectAddressKind,
  shortenAddress,
  SUPPORTED_CHAINS_DISPLAY,
} from '@/lib/wallet'
import type { FeeRow } from '@/lib/fees'

export function WalletPanel({
  loading,
  onLoading,
  onData,
  activeLabel,
}: {
  loading: boolean
  onLoading: (loading: boolean) => void
  onData: (rows: FeeRow[], label: string) => void
  activeLabel: string | null
}) {
  const { wallets, connectWallet, addWallet, removeWallet, isConnecting, error, clearError } =
    useWallets()
  const [manualAddress, setManualAddress] = useState('')
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function analyzeWallets() {
    if (!wallets.length) {
      setFetchError('Connect or add at least one wallet first.')
      return
    }

    setFetchError(null)
    clearError()
    onLoading(true)

    try {
      const txRes = await fetch('/api/wallets/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: wallets }),
      })

      if (!txRes.ok) {
        const body = (await txRes.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Could not fetch wallet transactions.')
      }

      const txData = (await txRes.json()) as { rows: unknown[] }
      if (!txData.rows?.length) {
        throw new Error('No transactions with gas fees found.')
      }

      const enrichRes = await fetch('/api/prices/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: txData.rows }),
      })

      if (!enrichRes.ok) {
        const body = (await enrichRes.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? 'Could not price wallet transactions.')
      }

      const enriched = (await enrichRes.json()) as { rows: FeeRow[] }
      const label = `${wallets.length} wallet${wallets.length > 1 ? 's' : ''} · on-chain`
      onData(enriched.rows, label)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Wallet analysis failed.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <div className="glass flex h-full flex-col rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Connect Wallets
        </h2>
        <p className="text-xs text-muted-foreground">
          Add multiple wallets — we pull gas history across each chain, then
          compare what you would have paid on Sui.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUPPORTED_CHAINS_DISPLAY.map((name) => (
            <span
              key={name}
              className="rounded-full border border-border/70 bg-secondary/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isConnecting || loading}
          onClick={() => connectWallet()}
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          {isConnecting ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Wallet className="size-3.5" aria-hidden="true" />
          )}
          Connect wallet
        </button>

        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const value = manualAddress.trim()
            if (!value) return
            if (detectAddressKind(value) === null) {
              setFetchError(
                `Unsupported address. Supported chains: ${SUPPORTED_CHAINS_DISPLAY.join(', ')}.`,
              )
              return
            }
            setFetchError(null)
            addWallet(value)
            setManualAddress('')
          }}
        >
          <input
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Paste EVM, Solana, or Tron address"
            className="min-w-0 flex-1 rounded-full border border-border bg-secondary/40 px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add
          </button>
        </form>
      </div>

      {wallets.length > 0 ? (
        <ul className="mb-4 max-h-36 space-y-2 overflow-y-auto">
          {wallets.map((wallet) => (
            <li
              key={wallet}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 px-3 py-2"
            >
              <span className="font-mono text-xs text-foreground">
                {shortenAddress(wallet, 6)}
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() => removeWallet(wallet)}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                aria-label={`Remove ${wallet}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No wallets yet. Connect MetaMask/Rabby or paste an address.
        </p>
      )}

      <button
        type="button"
        disabled={loading || !wallets.length}
        onClick={analyzeWallets}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Fetching &amp; pricing gas…
          </>
        ) : (
          <>
            <Zap className="size-4" aria-hidden="true" />
            Analyze wallet gas
          </>
        )}
      </button>

      {activeLabel && (
        <p className="mt-3 text-xs text-success">Active: {activeLabel}</p>
      )}
      {(error || fetchError) && (
        <p className="mt-3 text-xs text-destructive">{error ?? fetchError}</p>
      )}
    </div>
  )
}