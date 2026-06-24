export type SupportedChain = {
  id: number
  name: string
  nativeSymbol: string
  blockscoutUrl: string
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
  {
    id: 1,
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    blockscoutUrl: 'https://eth.blockscout.com',
  },
  {
    id: 137,
    name: 'Polygon',
    nativeSymbol: 'MATIC',
    blockscoutUrl: 'https://polygon.blockscout.com',
  },
  {
    id: 42161,
    name: 'Arbitrum',
    nativeSymbol: 'ETH',
    blockscoutUrl: 'https://arbitrum.blockscout.com',
  },
  {
    id: 10,
    name: 'Optimism',
    nativeSymbol: 'ETH',
    blockscoutUrl: 'https://optimism.blockscout.com',
  },
  {
    id: 8453,
    name: 'Base',
    nativeSymbol: 'ETH',
    blockscoutUrl: 'https://base.blockscout.com',
  },
  {
    id: 56,
    name: 'BNB Chain',
    nativeSymbol: 'BNB',
    blockscoutUrl: 'https://bsc.blockscout.com',
  },
]

export const TXS_PER_CHAIN = 40