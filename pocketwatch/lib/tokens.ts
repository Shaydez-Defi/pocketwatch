/** Map common CSV currency symbols to CoinGecko coin ids (used by DefiLlama). */
const TOKEN_IDS: Record<string, string> = {
  ETH: 'ethereum',
  ETHER: 'ethereum',
  WETH: 'ethereum',
  BTC: 'bitcoin',
  BITCOIN: 'bitcoin',
  SOL: 'solana',
  SOLANA: 'solana',
  SUI: 'sui',
  MATIC: 'matic-network',
  POLYGON: 'matic-network',
  POL: 'matic-network',
  AVAX: 'avalanche-2',
  BNB: 'binancecoin',
  ARB: 'arbitrum',
  OP: 'optimism',
  FTM: 'fantom',
  NEAR: 'near',
  APT: 'aptos',
  ATOM: 'cosmos',
  DOT: 'polkadot',
  ADA: 'cardano',
  TRX: 'tron',
  TON: 'the-open-network',
  SEI: 'sei-network',
  INJ: 'injective-protocol',
  STRK: 'starknet',
  BASE: 'base',
}

const USD_STABLES = new Set(['USD', 'USDC', 'USDT', 'DAI', 'BUSD', 'USDE', 'FDUSD'])

export function isUsdStable(currency: string | null): boolean {
  if (!currency) return false
  return USD_STABLES.has(currency.toUpperCase())
}

export function resolveTokenId(
  currency: string | null,
  feeHeader: string,
): string | null {
  if (currency) {
    const upper = currency.toUpperCase()
    if (isUsdStable(currency)) return null
    if (TOKEN_IDS[upper]) return TOKEN_IDS[upper]
    return currency.toLowerCase().replace(/[^a-z0-9-]/g, '')
  }

  const h = feeHeader.toLowerCase()
  if (h.includes('eth')) return 'ethereum'
  if (h.includes('btc') || h.includes('bitcoin')) return 'bitcoin'
  if (h.includes('sol')) return 'solana'
  if (h.includes('matic') || h.includes('polygon')) return 'matic-network'
  if (h.includes('avax')) return 'avalanche-2'
  if (h.includes('bnb')) return 'binancecoin'
  if (h.includes('arb')) return 'arbitrum'
  if (h.includes('op') && h.includes('gas')) return 'optimism'

  return null
}

export function toLlamaId(coinId: string): string {
  return `coingecko:${coinId}`
}

export const SUI_COIN_ID = 'sui'