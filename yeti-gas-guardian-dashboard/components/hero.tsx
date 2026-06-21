'use client'

import Image from 'next/image'
import { Sparkles, ShieldCheck } from 'lucide-react'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

export function Hero() {
  const account = useCurrentAccount()

  return (
    <section className="grid items-center gap-8 md:grid-cols-2">
      {/* Yeti character */}
      <div className="relative flex justify-center md:justify-start">
        <div
          className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-3xl animate-glow-pulse"
          aria-hidden="true"
        />
        <Image
          src="/yeti-guardian.png"
          alt="The PocketWatch Yeti mascot wearing headphones"
          width={360}
          height={360}
          priority
          className="relative z-10 w-56 animate-yeti-float drop-shadow-2xl sm:w-72 md:w-[22rem]"
        />
      </div>

      {/* Tagline */}
      <div className="flex flex-col gap-5 text-center md:text-left">
        <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary md:mx-0">
          <Sparkles className="size-3.5" aria-hidden="true" />
          proof-of-savings · powered by Sui
        </span>
        <h1 className="text-balance font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Your gas is{' '}
          <span className="text-primary text-glow">leaking</span>. Prove what Sui
          saves you <span className="text-primary text-glow">onchain</span>.
        </h1>
        <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Connect your wallets or drop a CSV. We pull real gas history, price it
          per day, and show what the same moves would&apos;ve cost on Sui. Then
          let you write that proof to the chain, forever. The Yeti keeps the
          receipts.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row md:items-start">
          <div className="[&_button]:!rounded-xl [&_button]:!px-5 [&_button]:!py-3 [&_button]:!text-sm [&_button]:!font-semibold">
            <ConnectButton
              connectText={account ? 'Sui wallet connected' : 'Connect Sui to start'}
            />
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Your savings, recorded on a public Sui ledger
          </span>
        </div>
      </div>
    </section>
  )
}
