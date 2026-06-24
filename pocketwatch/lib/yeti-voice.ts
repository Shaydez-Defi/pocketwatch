import { formatUsd } from '@/lib/fees'
import type { PocketWatchInsights } from '@/lib/insights'

const GENERAL_QUIPS = [
  'Omo… wallet dey bleed.',
  'Gas don humble person.',
  'Big man lifestyle no easy.',
  'The chain giveth, the chain taketh.',
  'Na small small money dey disappear.',
  'Your balance dey wave goodbye.',
]

const HIGH_FEE_QUIPS = [
  'This transaction fit buy shawarma and Coke.',
  'That fee could\'ve been lunch for two.',
  'Gas ate like it had appetite.',
]

const LOW_FEE_QUIPS = [
  'Chill day. Even the validators bored.',
  'Light spending. The Yeti approves.',
]

export function pickYetiQuip(insights: PocketWatchInsights | null, saved: number): string {
  if (!insights) {
    return GENERAL_QUIPS[Math.floor(Math.random() * GENERAL_QUIPS.length)]
  }

  if (insights.topRegrets[0]?.paid > 50) {
    return HIGH_FEE_QUIPS[Math.floor(Math.random() * HIGH_FEE_QUIPS.length)]
  }

  if (saved <= 0) {
    return LOW_FEE_QUIPS[Math.floor(Math.random() * LOW_FEE_QUIPS.length)]
  }

  if (saved > 500) {
    return `Walahi, ${formatUsd(saved)} could've stayed in your pocket. The Yeti is seated.`
  }

  const pool = [...GENERAL_QUIPS, ...HIGH_FEE_QUIPS]
  return pool[Math.floor(Math.random() * pool.length)]
}