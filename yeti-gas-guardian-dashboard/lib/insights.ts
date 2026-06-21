import type { FeeRow } from '@/lib/fees'
import { formatUsd, summarize } from '@/lib/fees'

export type PersonalityId =
  | 'professional_gas_burner'
  | 'bridge_addict'
  | 'defi_warrior'
  | 'nft_degenerate'
  | 'stablecoin_merchant'
  | 'chain_hopper'

export type Personality = {
  id: PersonalityId
  title: string
  icon: string
  description: string
  confidence: number
}

export type RegretItem = {
  date: string
  chain: string
  paid: number
  quip: string
  txHash?: string
}

export type MonthlySpend = {
  month: string
  label: string
  total: number
  txCount: number
}

export type CalendarDay = {
  date: string
  amount: number
  level: 0 | 1 | 2 | 3 | 4
}

export type AlternateEstimate = {
  chain: string
  estimatedTotal: number
  estimatedSavings: number
  perTxEstimate: number
}

export type PocketWatchInsights = {
  totalPaid: number
  totalSui: number
  saved: number
  txCount: number
  favoriteChain: string
  personality: Personality
  topRegrets: RegretItem[]
  monthlyDiet: MonthlySpend[]
  calendar: CalendarDay[]
  alternateRealities: AlternateEstimate[]
  analystBullets: string[]
  heaviestMonth: MonthlySpend | null
  quietestMonth: MonthlySpend | null
}

const L2_CHAINS = new Set(['Arbitrum', 'Optimism', 'Base', 'Polygon', 'BNB Chain'])

const REGRET_QUIPS = [
  'Wallet, don\'t cry.',
  'Gas humbled you here.',
  'This one stung.',
  'The chain ate good.',
  'Omo, see money.',
  'Big man lifestyle no easy.',
]

/** Rough avg USD per tx. Estimates only, not live quotes. */
const ALT_CHAIN_PER_TX_USD: Record<string, number> = {
  Sui: 0.001,
  Solana: 0.003,
  Base: 0.018,
  Polygon: 0.012,
  Arbitrum: 0.055,
}

const PERSONALITIES: Record<
  PersonalityId,
  Omit<Personality, 'id' | 'confidence'>
> = {
  professional_gas_burner: {
    title: 'Professional Gas Burner',
    icon: '🔥',
    description:
      'You don\'t "pay fees." You fund entire validator retirement plans. Respect the dedication.',
  },
  bridge_addict: {
    title: 'Bridge Addict',
    icon: '🌉',
    description:
      'L1 to L2 to L3 and back again. Your wallet lives in transit. Border control would be proud.',
  },
  defi_warrior: {
    title: 'DeFi Warrior',
    icon: '⚔️',
    description:
      'Many txs, many chains, many swaps. You fight for yield. Gas is just collateral damage.',
  },
  nft_degenerate: {
    title: 'NFT Degenerate',
    icon: '🖼️',
    description:
      'Big Ethereum energy, premium gas, questionable JPEGs. The receipts don\'t lie.',
  },
  stablecoin_merchant: {
    title: 'Stablecoin Merchant',
    icon: '💵',
    description:
      'Lots of moves, small fees each time. You treat gas like a business expense. Very corporate of you.',
  },
  chain_hopper: {
    title: 'Chain Hopper',
    icon: '🦘',
    description:
      'You refuse to pick a lane. Five chains, zero loyalty. A true crypto nomad.',
  },
}

function parseMonthKey(date: string): string | null {
  const iso = date.match(/^(\d{4})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}`
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const lower = date.toLowerCase().slice(0, 3)
  const idx = months.indexOf(lower)
  if (idx >= 0) return `sample-${String(idx + 1).padStart(2, '0')}`
  return null
}

function monthLabel(key: string): string {
  if (key.startsWith('sample-')) {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return names[Number(key.split('-')[1]) - 1] ?? key
  }
  const [y, m] = key.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

function chainLabel(row: FeeRow): string {
  return row.chain ?? row.token ?? 'Unknown'
}

function detectPersonality(rows: FeeRow[], totalPaid: number): Personality {
  const txCount = rows.length
  const byChain: Record<string, number> = {}
  let l2Tx = 0
  let ethTx = 0
  let totalFees = 0

  for (const row of rows) {
    const c = chainLabel(row)
    byChain[c] = (byChain[c] ?? 0) + 1
    totalFees += row.paid
    if (L2_CHAINS.has(c)) l2Tx++
    if (c === 'Ethereum') ethTx++
  }

  const chainCount = Object.keys(byChain).length
  const avgFee = totalFees / Math.max(txCount, 1)
  const l2Ratio = l2Tx / Math.max(txCount, 1)

  const scores: Array<{ id: PersonalityId; score: number }> = [
    { id: 'professional_gas_burner', score: totalPaid > 800 ? 0.9 : totalPaid > 400 ? 0.65 : 0.2 },
    {
      id: 'bridge_addict',
      score: l2Ratio > 0.45 && ethTx > 0 ? 0.85 : l2Ratio > 0.3 ? 0.5 : 0.1,
    },
    {
      id: 'defi_warrior',
      score: txCount > 25 && chainCount >= 2 ? 0.75 : txCount > 12 ? 0.45 : 0.15,
    },
    {
      id: 'nft_degenerate',
      score: ethTx / Math.max(txCount, 1) > 0.5 && avgFee > 8 ? 0.7 : ethTx > 5 ? 0.35 : 0.1,
    },
    {
      id: 'stablecoin_merchant',
      score: avgFee < 1.2 && txCount > 15 ? 0.8 : avgFee < 2 && txCount > 8 ? 0.5 : 0.1,
    },
    {
      id: 'chain_hopper',
      score: chainCount >= 4 ? 0.88 : chainCount >= 3 ? 0.6 : 0.15,
    },
  ]

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  const meta = PERSONALITIES[best.id]
  return {
    id: best.id,
    ...meta,
    confidence: Math.round(Math.min(0.95, Math.max(0.42, best.score)) * 100),
  }
}

function buildTopRegrets(rows: FeeRow[]): RegretItem[] {
  return [...rows]
    .sort((a, b) => b.paid - a.paid)
    .slice(0, 5)
    .map((row, i) => ({
      date: row.pricedOn ?? row.date,
      chain: chainLabel(row),
      paid: row.paid,
      quip: REGRET_QUIPS[i % REGRET_QUIPS.length],
      txHash: row.txHash,
    }))
}

function buildMonthlyDiet(rows: FeeRow[]): MonthlySpend[] {
  const map = new Map<string, { total: number; txCount: number }>()
  for (const row of rows) {
    const key = parseMonthKey(row.pricedOn ?? row.date)
    if (!key) continue
    const cur = map.get(key) ?? { total: 0, txCount: 0 }
    cur.total += row.paid
    cur.txCount++
    map.set(key, cur)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      label: monthLabel(month),
      total: v.total,
      txCount: v.txCount,
    }))
}

function buildCalendar(rows: FeeRow[]): CalendarDay[] {
  const map = new Map<string, number>()
  for (const row of rows) {
    const d = row.pricedOn ?? (/^\d{4}-\d{2}-\d{2}/.test(row.date) ? row.date.slice(0, 10) : null)
    if (!d) continue
    map.set(d, (map.get(d) ?? 0) + row.paid)
  }
  const max = Math.max(...map.values(), 0.01)
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date,
      amount,
      level: (amount === 0
        ? 0
        : amount < max * 0.2
          ? 1
          : amount < max * 0.45
            ? 2
            : amount < max * 0.7
              ? 3
              : 4) as CalendarDay['level'],
    }))
}

function buildAlternateRealities(rows: FeeRow[], totalPaid: number): AlternateEstimate[] {
  const txCount = rows.length
  const totalSui = rows.reduce((s, r) => s + r.sui, 0)

  return ['Sui', 'Solana', 'Base', 'Polygon', 'Arbitrum'].map((chain) => {
    const perTx =
      chain === 'Sui'
        ? txCount > 0
          ? totalSui / txCount
          : ALT_CHAIN_PER_TX_USD.Sui
        : ALT_CHAIN_PER_TX_USD[chain]
    const estimatedTotal = chain === 'Sui' ? totalSui : perTx * txCount
    return {
      chain,
      perTxEstimate: perTx,
      estimatedTotal,
      estimatedSavings: Math.max(totalPaid - estimatedTotal, 0),
    }
  })
}

function buildAnalystBullets(
  rows: FeeRow[],
  insights: {
    totalPaid: number
    saved: number
    favoriteChain: string
    personality: Personality
    monthlyDiet: MonthlySpend[]
    topRegrets: RegretItem[]
  },
): string[] {
  const bullets: string[] = []
  const txCount = rows.length
  const chainCounts: Record<string, number> = {}
  for (const row of rows) {
    const c = chainLabel(row)
    chainCounts[c] = (chainCounts[c] ?? 0) + 1
  }

  bullets.push(
    `You ran ${txCount} onchain move${txCount === 1 ? '' : 's'} and ${formatUsd(insights.totalPaid)} quietly left your wallet as gas. That's real money, not "network noise."`,
  )

  if (insights.favoriteChain !== 'Unknown') {
    const pct = Math.round(
      ((chainCounts[insights.favoriteChain] ?? 0) / Math.max(txCount, 1)) * 100,
    )
    bullets.push(
      `${insights.favoriteChain} carried ${pct}% of your activity. Whatever you do there, that's your home turf.`,
    )
  }

  const heavy = insights.monthlyDiet.length
    ? insights.monthlyDiet.reduce((max, m) => (m.total > max.total ? m : max), insights.monthlyDiet[0])
    : null
  if (heavy) {
    bullets.push(
      `${heavy.label} was your heaviest month at ${formatUsd(heavy.total)}. Something was happening: launches, farming, or pure chaos.`,
    )
  }

  bullets.push(
    `Personality read: ${insights.personality.title} (${insights.personality.confidence}% confidence). ${insights.personality.description}`,
  )

  if (insights.saved > 0) {
    bullets.push(
      `On other chains, the same activity might've cost less, roughly ${formatUsd(insights.saved)} less on Sui (estimate). Your call whether that matters; we're just holding the mirror.`,
    )
  }

  if (insights.topRegrets[0]) {
    bullets.push(
      `Your biggest single bleed: ${formatUsd(insights.topRegrets[0].paid)} on ${insights.topRegrets[0].chain}. ${insights.topRegrets[0].quip}`,
    )
  }

  return bullets
}

export function buildInsights(rows: FeeRow[]): PocketWatchInsights {
  const { totalPaid, totalSui, saved } = summarize(rows)
  const txCount = rows.length

  const chainTotals: Record<string, number> = {}
  for (const row of rows) {
    const c = chainLabel(row)
    chainTotals[c] = (chainTotals[c] ?? 0) + row.paid
  }
  const favoriteChain =
    Object.entries(chainTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown'

  const personality = detectPersonality(rows, totalPaid)
  const topRegrets = buildTopRegrets(rows)
  const monthlyDiet = buildMonthlyDiet(rows)
  const calendar = buildCalendar(rows)
  const alternateRealities = buildAlternateRealities(rows, totalPaid)

  const heaviestMonth =
    monthlyDiet.length > 0
      ? monthlyDiet.reduce((max, m) => (m.total > max.total ? m : max), monthlyDiet[0])
      : null
  const quietestMonth =
    monthlyDiet.length > 0
      ? monthlyDiet.reduce((min, m) => (m.total < min.total ? m : min), monthlyDiet[0])
      : null

  const partial = {
    totalPaid,
    saved,
    favoriteChain,
    personality,
    monthlyDiet,
    topRegrets,
    heaviestMonth,
  }

  return {
    totalPaid,
    totalSui,
    saved,
    txCount,
    favoriteChain,
    personality,
    topRegrets,
    monthlyDiet,
    calendar,
    alternateRealities,
    analystBullets: buildAnalystBullets(rows, partial),
    heaviestMonth,
    quietestMonth,
  }
}

export function answerAnalystQuestion(
  question: string,
  insights: PocketWatchInsights,
): string {
  const q = question.toLowerCase()

  if (q.includes('why') && (q.includes('high') || q.includes('much') || q.includes('fee'))) {
    const heavy = insights.heaviestMonth
    return heavy
      ? `Fees spike when activity spikes. Your worst month was ${heavy.label} at ${formatUsd(heavy.total)} across ${heavy.txCount} txs. ${insights.favoriteChain} is where most of your money went. That's the pattern.`
      : `You're averaging ${formatUsd(insights.totalPaid / Math.max(insights.txCount, 1))} per transaction. Busy chains + busy months = expensive mirror.`
  }

  if (q.includes('what kind') || q.includes('who am') || q.includes('personality')) {
    return `You're giving ${insights.personality.title} energy (${insights.personality.confidence}% confidence). ${insights.personality.description}`
  }

  if (q.includes('which chain') || q.includes('rely') || q.includes('most')) {
    return `${insights.favoriteChain} is your main stage. That's where the bulk of your gas story lives. Not judgment, just the ledger talking.`
  }

  if (q.includes('explain') || q.includes('behavior')) {
    return insights.analystBullets.slice(0, 3).join(' ')
  }

  return insights.analystBullets[0] ??
    'Paste a wallet or CSV first, then I can roast your gas habits properly.'
}

export function buildWrappedCaption(insights: PocketWatchInsights): string {
  return [
    '🏔️ PocketWatch Wrapped',
    `Gas spent: ${formatUsd(insights.totalPaid)}`,
    `Transactions: ${insights.txCount}`,
    `Top chain: ${insights.favoriteChain}`,
    `Vibe: ${insights.personality.title}`,
    `Est. savings elsewhere: ~${formatUsd(insights.saved)}`,
    '',
    'Where did your onchain money go? pocketwatch.app',
  ].join('\n')
}

export function buildShareTweet(insights: PocketWatchInsights): string {
  const text = `I spent ${formatUsd(insights.totalPaid)} on gas across ${insights.txCount} txs. PocketWatch says I'm a ${insights.personality.title} ${insights.personality.icon}\n\nWhere did your onchain money go?`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}