'use client'

import { useState } from 'react'
import { Snowflake, Wallet, ChevronDown, Loader2 } from 'lucide-react'
import { ConnectButton } from '@mysten/dapp-kit'
import { useWallets } from '@/components/wallet-provider'
import { connectBrowserWallet, shortenAddress } from '@/lib/wallet'

export function TopNav() {
  const { wallets, addWallet, removeWallet } = useWallets()
  const [open, setOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [navError, setNavError] = useState<string | null>(null)

  async function handleConnect() {
    setConnecting(true)
    setNavError(null)
    try {
      const accounts = await connectBrowserWallet()
      for (const account of accounts) addWallet(account)
    } catch (err) {
      setNavError(err instanceof Error ? err.message : 'Wallet connection failed.')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary glow-purple">
            <Snowflake className="size-5" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-sm font-bold tracking-tight text-foreground">
              Yeti Gas Guardian
            </p>
            <p className="text-[11px] text-muted-foreground">your fees, watched over</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton connectText="Connect Sui" />
          <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={[
              'group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
              wallets.length
                ? 'border-success/40 bg-success/10 text-success glow-green'
                : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 glow-purple',
            ].join(' ')}
          >
            {connecting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Wallet className="size-4" aria-hidden="true" />
            )}
            {wallets.length ? (
              <span className="font-mono text-xs">
                {wallets.length} wallet{wallets.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span>Connect Wallet</span>
            )}
            <ChevronDown className="size-4 opacity-70" aria-hidden="true" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border bg-background p-3 shadow-2xl">
              <button
                type="button"
                disabled={connecting}
                onClick={() => handleConnect()}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Wallet className="size-3.5" aria-hidden="true" />
                )}
                Connect another wallet
              </button>

              {navError && (
                <p className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
                  {navError}
                </p>
              )}

              {wallets.length ? (
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {wallets.map((wallet) => (
                    <li
                      key={wallet}
                      className="flex items-center justify-between rounded-lg bg-secondary/40 px-2 py-1.5"
                    >
                      <span className="font-mono text-[11px] text-foreground">
                        {shortenAddress(wallet, 5)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeWallet(wallet)}
                        className="text-[11px] text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-[11px] text-muted-foreground">
                  No wallets connected yet.
                </p>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  )
}