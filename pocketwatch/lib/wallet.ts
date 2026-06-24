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

/** EVM chains offered through WalletConnect (Ethereum + the analysis chains). */
const WC_EVM_CHAINS = [1, 56, 137, 42161, 10, 8453]

/**
 * Connect an EVM wallet via WalletConnect, the path used on mobile browsers
 * (and desktop without an extension), where `window.ethereum` is absent.
 * Requires NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID; without it we surface a clear
 * "paste your address" hint instead of a hard failure.
 */
export async function connectViaWalletConnect(): Promise<string[]> {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  if (!projectId) {
    throw new Error(
      'No wallet detected. On mobile, paste your wallet address below, or set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to enable tap to connect.',
    )
  }

  const { EthereumProvider } = await import('@walletconnect/ethereum-provider')
  const wc = await EthereumProvider.init({
    projectId,
    chains: [1],
    optionalChains: WC_EVM_CHAINS as [number, ...number[]],
    showQrModal: true,
    metadata: {
      name: 'PocketWatch',
      description: 'Track your gas fees across chains and compare to Sui.',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://pocketwatch.app',
      icons: ['/logo.png'],
    },
  })

  const accounts = (await wc.connect().then(() => wc.accounts)) as string[]
  if (!accounts?.length) {
    throw new Error('No accounts returned from WalletConnect.')
  }

  return accounts.map((a) => a.toLowerCase())
}

export async function connectBrowserWallet(): Promise<string[]> {
  const provider = getEthereumProvider()

  // Injected provider present (desktop extension or wallet in-app browser).
  if (provider) {
    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[]
    if (accounts?.length) {
      return accounts.map((a) => a.toLowerCase())
    }
  }

  // No injected provider (typical on a plain mobile browser) → WalletConnect.
  return connectViaWalletConnect()
}