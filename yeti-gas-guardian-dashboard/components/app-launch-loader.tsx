'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { LAUNCH_LOADING_MESSAGES } from '@/lib/loading-messages'

function PocketWatchIcon() {
  return (
    <div className="relative mx-auto size-20" aria-hidden="true">
      <svg viewBox="0 0 80 80" className="size-full drop-shadow-lg">
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="oklch(0.74 0.13 295 / 0.35)"
          strokeWidth="2"
        />
        <circle
          cx="40"
          cy="40"
          r="30"
          fill="oklch(0.21 0.035 283 / 80%)"
          stroke="oklch(0.74 0.13 295 / 0.5)"
          strokeWidth="1.5"
        />
        <circle cx="40" cy="40" r="3" fill="oklch(0.74 0.13 295)" />
        <g className="animate-watch-hand origin-[40px_40px]">
          <line
            x1="40"
            y1="40"
            x2="40"
            y2="18"
            stroke="oklch(0.93 0.015 286)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="40"
            y1="40"
            x2="56"
            y2="48"
            stroke="oklch(0.74 0.13 295)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <rect
          x="36"
          y="6"
          width="8"
          height="6"
          rx="2"
          fill="oklch(0.74 0.13 295 / 0.6)"
        />
      </svg>
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-glow-pulse" />
    </div>
  )
}

export function AppLaunchLoader() {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit' | 'done'>('enter')
  const [messageIndex, setMessageIndex] = useState(0)

  const shuffledMessages = useMemo(() => {
    const copy = [...LAUNCH_LOADING_MESSAGES]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }, [])

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('visible'), 50)
    return () => clearTimeout(enterTimer)
  }, [])

  useEffect(() => {
    if (phase === 'done') return

    const minDisplay = setTimeout(() => setPhase('exit'), 2200)
    const doneTimer = setTimeout(() => setPhase('done'), 2900)

    return () => {
      clearTimeout(minDisplay)
      clearTimeout(doneTimer)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'done') return
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % shuffledMessages.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [phase, shuffledMessages.length])

  if (phase === 'done') return null

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md transition-opacity duration-700',
        phase === 'enter' ? 'opacity-0' : '',
        phase === 'visible' ? 'opacity-100' : '',
        phase === 'exit' ? 'opacity-0 pointer-events-none' : '',
      ].join(' ')}
      aria-live="polite"
      aria-busy={phase !== 'exit'}
      role="status"
    >
      <div
        className={[
          'flex max-w-md flex-col items-center gap-8 px-8 text-center transition-all duration-700',
          phase === 'visible' ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        ].join(' ')}
      >
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="PocketWatch"
            width={52}
            height={52}
            priority
            className="size-[52px] rounded-2xl object-cover glow-purple"
          />
          <Image
            src="/yeti-guardian.png"
            alt=""
            width={72}
            height={72}
            priority
            className="size-[72px] animate-yeti-float opacity-90"
          />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            PocketWatch
          </h1>
          <p className="text-sm text-muted-foreground">your onchain money mirror</p>
        </div>

        <PocketWatchIcon />

        <p
          key={messageIndex}
          className="min-h-[1.5rem] animate-message-in text-sm font-medium text-primary"
        >
          {shuffledMessages[messageIndex]}
        </p>

        <div className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 rounded-full bg-primary/60 animate-loader-dot"
              style={{ animationDelay: `${dot * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}