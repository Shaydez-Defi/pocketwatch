import { SUPPORTED_CHAINS, TXS_PER_CHAIN } from '@/lib/chains'
import type { ParsedCsvRow } from '@/lib/fees'
import { detectAddressKind } from '@/lib/wallet'

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
const TRONSCAN_API = 'https://apilist.tronscanapi.com'
const NON_EVM_TX_CAP = 15

type BlockscoutTx = {
  hash?: string
  timestamp?: string
  status?: string
  fee?: { value?: string }
}

type BlockscoutPage = {
  items?: BlockscoutTx[]
}

type EtherscanTx = {
  timeStamp?: string
  gasUsed?: string
  gasPrice?: string
  isError?: string
  hash?: string
}

const FETCH_TIMEOUT_MS = 20_000

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function weiToNative(wei: string): number {
  return Number(wei) / 1e18
}

function timestampToDate(ts: string): string {
  const seconds = Number(ts)
  if (!Number.isNaN(seconds) && seconds > 1_000_000_000) {
    return new Date(seconds * 1000).toISOString().slice(0, 10)
  }
  return ts.slice(0, 10)
}

function txToRow(
  date: string,
  feeAmount: number,
  chainSymbol: string,
  chainName: string,
  txHash?: string,
): ParsedCsvRow | null {
  if (feeAmount <= 0) return null
  return {
    date,
    feeAmount,
    currency: chainSymbol,
    feeHeader: 'gas',
    suiGasAmount: null,
    chain: chainName,
    txHash,
  }
}

async function fetchBlockscoutTxs(
  address: string,
  chain: (typeof SUPPORTED_CHAINS)[number],
): Promise<ParsedCsvRow[]> {
  const url = `${chain.blockscoutUrl}/api/v2/addresses/${address}/transactions?filter=from`
  const res = await fetchWithTimeout(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`${chain.name} explorer returned ${res.status}`)
  }

  const page = (await res.json()) as BlockscoutPage
  const rows: ParsedCsvRow[] = []

  for (const tx of page.items ?? []) {
    if (!tx.timestamp || !tx.fee?.value) continue
    if (tx.status && tx.status !== 'ok') continue
    const row = txToRow(
      tx.timestamp.slice(0, 10),
      weiToNative(tx.fee.value),
      chain.nativeSymbol,
      chain.name,
      tx.hash,
    )
    if (row) rows.push(row)
    if (rows.length >= TXS_PER_CHAIN) break
  }

  return rows
}

async function fetchEtherscanTxs(
  address: string,
  chain: (typeof SUPPORTED_CHAINS)[number],
  apiKey: string,
): Promise<ParsedCsvRow[]> {
  const params = new URLSearchParams({
    chainid: String(chain.id),
    module: 'account',
    action: 'txlist',
    address,
    startblock: '0',
    endblock: '99999999',
    page: '1',
    offset: String(TXS_PER_CHAIN),
    sort: 'desc',
    apikey: apiKey,
  })

  const res = await fetchWithTimeout(
    `https://api.etherscan.io/v2/api?${params}`,
    { headers: { Accept: 'application/json' }, next: { revalidate: 300 } },
  )

  if (!res.ok) {
    throw new Error(`Etherscan ${chain.name} returned ${res.status}`)
  }

  const data = (await res.json()) as {
    status?: string
    message?: string
    result?: EtherscanTx[] | string
  }

  if (data.status !== '1' || !Array.isArray(data.result)) {
    const msg = typeof data.result === 'string' ? data.result : data.message
    throw new Error(msg ?? `Etherscan ${chain.name} returned no data`)
  }

  const rows: ParsedCsvRow[] = []
  for (const tx of data.result) {
    if (tx.isError === '1' || !tx.gasUsed || !tx.gasPrice || !tx.timeStamp) continue
    const feeAmount = (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18
    const row = txToRow(
      timestampToDate(tx.timeStamp),
      feeAmount,
      chain.nativeSymbol,
      chain.name,
      tx.hash,
    )
    if (row) rows.push(row)
  }

  return rows
}

async function fetchChainTransactions(
  address: string,
  chain: (typeof SUPPORTED_CHAINS)[number],
): Promise<ParsedCsvRow[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY

  if (apiKey) {
    try {
      const rows = await fetchEtherscanTxs(address, chain, apiKey)
      if (rows.length) return rows
    } catch {
      // fall through to blockscout
    }
  }

  return fetchBlockscoutTxs(address, chain)
}

type SolanaSignature = { signature?: string; blockTime?: number | null }

async function fetchSolanaTransactions(
  address: string,
): Promise<ParsedCsvRow[]> {
  async function rpc<T>(method: string, params: unknown[]): Promise<T> {
    const res = await fetchWithTimeout(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    if (!res.ok) throw new Error(`Solana RPC returned ${res.status}`)
    const data = (await res.json()) as { result?: T; error?: { message?: string } }
    if (data.error) throw new Error(data.error.message ?? 'Solana RPC error')
    return data.result as T
  }

  const sigs = await rpc<SolanaSignature[]>('getSignaturesForAddress', [
    address,
    { limit: NON_EVM_TX_CAP },
  ])

  const rows: ParsedCsvRow[] = []
  for (const sig of sigs ?? []) {
    if (!sig.signature) continue
    try {
      const tx = await rpc<{ meta?: { fee?: number } | null; blockTime?: number | null }>(
        'getTransaction',
        [sig.signature, { maxSupportedTransactionVersion: 0 }],
      )
      const feeLamports = tx?.meta?.fee
      if (!feeLamports) continue
      const blockTime = tx?.blockTime ?? sig.blockTime
      const date = blockTime
        ? new Date(blockTime * 1000).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
      const row = txToRow(date, feeLamports / 1e9, 'SOL', 'Solana', sig.signature)
      if (row) rows.push(row)
    } catch {
      // skip individual tx failures (rate limits, pruned history)
    }
  }

  return rows
}

type TronTx = {
  hash?: string
  timestamp?: number
  cost?: { fee?: number; net_fee?: number; energy_fee?: number }
}

async function fetchTronTransactions(address: string): Promise<ParsedCsvRow[]> {
  const url = `${TRONSCAN_API}/api/transaction?sort=-timestamp&count=true&limit=${NON_EVM_TX_CAP}&start=0&address=${address}`
  const res = await fetchWithTimeout(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`TronScan returned ${res.status}`)

  const data = (await res.json()) as { data?: TronTx[] }
  const rows: ParsedCsvRow[] = []

  for (const tx of data.data ?? []) {
    const feeSun = tx.cost?.fee ?? 0
    if (!feeSun || !tx.timestamp) continue
    const date = new Date(tx.timestamp).toISOString().slice(0, 10)
    const row = txToRow(date, feeSun / 1e6, 'TRX', 'Tron', tx.hash)
    if (row) rows.push(row)
  }

  return rows
}

async function fetchEvmTransactions(address: string): Promise<{
  rows: ParsedCsvRow[]
  errors: string[]
}> {
  const rows: ParsedCsvRow[] = []
  const errors: string[] = []

  const chainResults = await Promise.allSettled(
    SUPPORTED_CHAINS.map((chain) => fetchChainTransactions(address, chain)),
  )

  for (let i = 0; i < chainResults.length; i++) {
    const result = chainResults[i]
    const chain = SUPPORTED_CHAINS[i]
    if (result.status === 'fulfilled') {
      rows.push(...result.value)
    } else {
      const message =
        result.reason instanceof Error ? result.reason.message : 'fetch failed'
      errors.push(`${chain.name}: ${message}`)
    }
  }

  return { rows, errors }
}

export async function fetchWalletTransactions(
  addresses: string[],
): Promise<{ rows: ParsedCsvRow[]; chainsScanned: number; walletsScanned: number }> {
  const normalized = [
    ...new Set(
      addresses
        .map((a) => a.trim())
        .filter(Boolean)
        .map((a) => (detectAddressKind(a) === 'evm' ? a.toLowerCase() : a)),
    ),
  ]

  if (!normalized.length) {
    throw new Error('Add at least one wallet address.')
  }

  const rows: ParsedCsvRow[] = []
  const errors: string[] = []

  for (const address of normalized) {
    const kind = detectAddressKind(address)
    try {
      if (kind === 'evm') {
        const evm = await fetchEvmTransactions(address)
        rows.push(...evm.rows)
        errors.push(...evm.errors)
      } else if (kind === 'solana') {
        rows.push(...(await fetchSolanaTransactions(address)))
      } else if (kind === 'tron') {
        rows.push(...(await fetchTronTransactions(address)))
      } else {
        errors.push(`${address.slice(0, 8)}…: unsupported address`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'fetch failed'
      errors.push(`${address.slice(0, 8)}…: ${message}`)
    }
  }

  if (!rows.length) {
    const detail = errors.length ? ` Details: ${errors.slice(0, 2).join('; ')}` : ''
    throw new Error(`No gas transactions found for these wallets.${detail}`)
  }

  rows.sort((a, b) => b.date.localeCompare(a.date))

  return {
    rows,
    chainsScanned: SUPPORTED_CHAINS.length + 2,
    walletsScanned: normalized.length,
  }
}