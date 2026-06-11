export type ChainKind = 'evm' | 'solana' | 'tron'

export function isEthAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}

export function isTronAddress(value: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim())
}

export function isSolAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim())
}

/** Detect which chain family an address belongs to. EVM and Tron are checked
 *  before Solana because a Tron address is also valid base58. */
export function detectAddressKind(value: string): ChainKind | null {
  const v = value.trim()
  if (isEthAddress(v)) return 'evm'
  if (isTronAddress(v)) return 'tron'
  if (isSolAddress(v)) return 'solana'
  return null
}

/** Lowercase only EVM addresses; Solana/Tron base58 is case-sensitive. */
export function normalizeAddress(value: string): string {
  const v = value.trim()
  return isEthAddress(v) ? v.toLowerCase() : v
}

export const SUPPORTED_CHAINS_DISPLAY = [
  'Ethereum',
  'BNB Chain',
  'Polygon',
  'Arbitrum',
  'Optimism',
  'Base',
  'Solana',
  'Tron',
] as const

export function shortenAddress(address: string, chars = 4): string {
  if (address.length < 10) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum
  return eth ?? null
}

export async function connectBrowserWallet(): Promise<string[]> {
  const provider = getEthereumProvider()
  if (!provider) {
    throw new Error('No wallet extension found. Install MetaMask or Rabby.')
  }

  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[]

  if (!accounts?.length) {
    throw new Error('No accounts returned from wallet.')
  }

  return accounts.map((a) => a.toLowerCase())
}