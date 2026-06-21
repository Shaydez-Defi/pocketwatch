import {
  SUI_COIN_ID,
  isUsdStable,
  resolveTokenId,
  toLlamaId,
} from '@/lib/tokens'
import type { FeeRow, ParsedCsvRow } from '@/lib/fees'

const LLAMA_BASE = 'https://coins.llama.fi'
const CACHE_TTL_MS = 60 * 60 * 1000
const SUI_AVG_GAS_SUI = 0.001

type CacheEntry<T> = { value: T; expiresAt: number }

const historicalCache = new Map<string, CacheEntry<Record<string, number>>>()
const currentCache = new Map<string, CacheEntry<Record<string, number>>>()

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key)
  if (!entry || entry.expiresAt < Date.now()) return null
  return entry.value
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

export function normalizeDate(input: string): string | null {
  const trimmed = input.trim()

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (us) {
    return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
  }

  const eu = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
  if (eu) {
    return `${eu[3]}-${eu[2].padStart(2, '0')}-${eu[1].padStart(2, '0')}`
  }

  return null
}

export function feeLooksLikeUsd(
  amount: number,
  feeHeader: string,
  currency: string | null,
): boolean {
  if (isUsdStable(currency)) return true
  const h = feeHeader.toLowerCase()
  if (h.includes('usd') || h.includes('dollar')) return true
  if (resolveTokenId(currency, feeHeader)) return false
  return amount >= 1
}

async function fetchCurrentPrices(
  coinIds: string[],
): Promise<Record<string, number>> {
  const unique = [...new Set(coinIds)]
  const cacheKey = unique.sort().join(',')
  const cached = getCached(currentCache, cacheKey)
  if (cached) return cached

  const llamaIds = unique.map(toLlamaId).join(',')
  const res = await fetch(`${LLAMA_BASE}/prices/current/${llamaIds}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`Live price fetch failed: ${res.status}`)
  }

  const data = (await res.json()) as {
    coins?: Record<string, { price?: number }>
  }

  const prices: Record<string, number> = {}
  for (const coinId of unique) {
    const price = data.coins?.[toLlamaId(coinId)]?.price
    if (typeof price === 'number') prices[coinId] = price
  }

  setCached(currentCache, cacheKey, prices)
  return prices
}

async function fetchHistoricalPricesForDate(
  dateKey: string,
  coinIds: string[],
): Promise<Record<string, number>> {
  const unique = [...new Set(coinIds)].sort()
  const cacheKey = `${dateKey}:${unique.join(',')}`
  const cached = getCached(historicalCache, cacheKey)
  if (cached) return cached

  const ts = Math.floor(new Date(`${dateKey}T12:00:00Z`).getTime() / 1000)
  const llamaIds = unique.map(toLlamaId).join(',')
  const res = await fetch(`${LLAMA_BASE}/prices/historical/${ts}/${llamaIds}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`Price history failed for ${dateKey}: ${res.status}`)
  }

  const data = (await res.json()) as {
    coins?: Record<string, { price?: number }>
  }

  const prices: Record<string, number> = {}
  for (const coinId of unique) {
    const price = data.coins?.[toLlamaId(coinId)]?.price
    if (typeof price === 'number') prices[coinId] = price
  }

  setCached(historicalCache, cacheKey, prices)
  return prices
}

async function fetchHistoricalPriceTable(
  dateKeys: string[],
  coinIds: string[],
): Promise<Map<string, Record<string, number>>> {
  const uniqueDates = [...new Set(dateKeys)]
  const table = new Map<string, Record<string, number>>()

  for (const dateKey of uniqueDates) {
    const prices = await fetchHistoricalPricesForDate(dateKey, coinIds)
    table.set(dateKey, prices)
  }

  return table
}

function priceOnDate(
  table: Map<string, Record<string, number>>,
  dateKey: string | null,
  coinId: string,
  liveFallback: number,
): number {
  if (!dateKey) return liveFallback
  const dayPrices = table.get(dateKey)
  if (!dayPrices) return liveFallback
  return dayPrices[coinId] ?? liveFallback
}

function collectCsvTokens(rows: ParsedCsvRow[]): {
  gasTokens: Set<string>
  dateKeys: string[]
  unknown: string[]
} {
  const gasTokens = new Set<string>()
  const dateKeys: string[] = []
  const unknown: string[] = []

  for (const row of rows) {
    const dateKey = normalizeDate(row.date)
    if (dateKey) dateKeys.push(dateKey)

    if (feeLooksLikeUsd(row.feeAmount, row.feeHeader, row.currency)) continue

    const tokenId = resolveTokenId(row.currency, row.feeHeader)
    if (!tokenId) {
      unknown.push(row.currency ?? row.feeHeader)
      continue
    }
    gasTokens.add(tokenId)
  }

  return { gasTokens, dateKeys, unknown }
}

export async function enrichParsedRows(rows: ParsedCsvRow[]): Promise<FeeRow[]> {
  const { gasTokens, dateKeys, unknown } = collectCsvTokens(rows)

  if (unknown.length) {
    const list = [...new Set(unknown)].join(', ')
    throw new Error(
      `Couldn't identify token for: ${list}. Add a currency column (e.g. ETH, SOL, MATIC).`,
    )
  }

  const priceTokens = [...new Set([...gasTokens, SUI_COIN_ID])]
  const currentPrices = await fetchCurrentPrices(priceTokens)
  const historicalTable = await fetchHistoricalPriceTable(dateKeys, priceTokens)
  const suiLive = currentPrices[SUI_COIN_ID] ?? 0

  return rows.map((row) => {
    const dateKey = normalizeDate(row.date)
    const alreadyUsd = feeLooksLikeUsd(row.feeAmount, row.feeHeader, row.currency)
    const tokenId = resolveTokenId(row.currency, row.feeHeader)

    let paid: number
    let tokenPriceUsd: number | undefined

    if (alreadyUsd) {
      paid = row.feeAmount
    } else if (!tokenId) {
      paid = row.feeAmount
    } else {
      const live = currentPrices[tokenId] ?? 0
      tokenPriceUsd = priceOnDate(historicalTable, dateKey, tokenId, live)
      paid = row.feeAmount * tokenPriceUsd
    }

    let sui: number
    const suiPrice = priceOnDate(historicalTable, dateKey, SUI_COIN_ID, suiLive)
    if (row.suiGasAmount !== null && !Number.isNaN(row.suiGasAmount)) {
      sui = row.suiGasAmount * suiPrice
    } else {
      sui = SUI_AVG_GAS_SUI * suiPrice
    }

    return {
      date: row.date,
      paid,
      sui,
      token: row.currency ?? tokenId,
      tokenPriceUsd,
      pricedOn: dateKey ?? undefined,
      chain: row.chain,
      txHash: row.txHash,
    }
  })
}