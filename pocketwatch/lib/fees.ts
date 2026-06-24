export type FeeRow = {
  date: string
  /** Fee actually paid on current chain (USD) */
  paid: number
  /** Fee Sui would have charged (USD) */
  sui: number
  /** Token symbol from CSV (ETH, SOL, etc.) */
  token?: string | null
  /** Token USD price used for this row, when priced from chain-native gas */
  tokenPriceUsd?: number
  /** Normalized YYYY-MM-DD used for historical lookup */
  pricedOn?: string
  chain?: string
  txHash?: string
}

export type ParsedCsvRow = {
  date: string
  feeAmount: number
  currency: string | null
  feeHeader: string
  /** Raw SUI gas amount from CSV, if a sui column exists */
  suiGasAmount: number | null
  /** Populated when sourced from on-chain wallet history */
  chain?: string
  txHash?: string
}

export const sampleFeeData: FeeRow[] = [
  { date: 'Jan', paid: 142.4, sui: 3.2 },
  { date: 'Feb', paid: 98.7, sui: 2.6 },
  { date: 'Mar', paid: 187.2, sui: 4.1 },
  { date: 'Apr', paid: 121.5, sui: 3.0 },
  { date: 'May', paid: 233.9, sui: 5.4 },
  { date: 'Jun', paid: 176.3, sui: 4.0 },
  { date: 'Jul', paid: 264.8, sui: 6.1 },
  { date: 'Aug', paid: 198.1, sui: 4.6 },
  { date: 'Sep', paid: 312.6, sui: 7.2 },
]

export function summarize(rows: FeeRow[]) {
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0)
  const totalSui = rows.reduce((s, r) => s + r.sui, 0)
  const saved = Math.max(totalPaid - totalSui, 0)
  return { totalPaid, totalSui, saved }
}

export function formatUsd(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function splitCsvLine(line: string): string[] {
  const cols: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      cols.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }

  cols.push(current.trim())
  return cols
}

function findFeeColumnIndex(headers: string[]): number {
  const exact = ['fee', 'gas', 'gas_fee', 'gasfee', 'transaction_fee', 'tx_fee']
  const exactIdx = headers.findIndex((h) => exact.includes(h))
  if (exactIdx !== -1) return exactIdx

  const fuzzyIdx = headers.findIndex(
    (h) =>
      (h.includes('fee') || h.includes('gas')) &&
      !h.includes('amount') &&
      !h.includes('saved'),
  )
  if (fuzzyIdx !== -1) return fuzzyIdx

  return headers.findIndex((h) => h.includes('paid') && !h.includes('amount'))
}

/**
 * Parse CSV into raw rows. USD conversion happens later via live/historical prices.
 */
export function parseFeeCsv(text: string): ParsedCsvRow[] | null {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return null

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('month'))
  const paidIdx = findFeeColumnIndex(headers)
  const suiIdx = headers.findIndex((h) => h.includes('sui'))
  const currencyIdx = headers.findIndex(
    (h) => h === 'currency' || h === 'token' || h.endsWith('_currency'),
  )
  if (paidIdx === -1) return null

  const rows: ParsedCsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const feeAmount = Number.parseFloat(cols[paidIdx])
    if (Number.isNaN(feeAmount)) continue

    const suiParsed = suiIdx !== -1 ? Number.parseFloat(cols[suiIdx]) : Number.NaN

    rows.push({
      date: dateIdx !== -1 ? (cols[dateIdx]?.trim() ?? `#${i}`) : `#${i}`,
      feeAmount,
      currency:
        currencyIdx !== -1 ? (cols[currencyIdx]?.trim().toUpperCase() ?? null) : null,
      feeHeader: headers[paidIdx],
      suiGasAmount: Number.isNaN(suiParsed) ? null : suiParsed,
    })
  }
  return rows.length ? rows : null
}