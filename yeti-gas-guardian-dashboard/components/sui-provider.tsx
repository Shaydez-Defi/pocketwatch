'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  SuiClientProvider,
  WalletProvider as SuiWalletProvider,
  createNetworkConfig,
} from '@mysten/dapp-kit'
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { SUI_NETWORK } from '@/lib/sui'
import '@mysten/dapp-kit/dist/index.css'

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' },
  mainnet: { url: getJsonRpcFullnodeUrl('mainnet'), network: 'mainnet' },
})

export function SuiProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={SUI_NETWORK}>
        <SuiWalletProvider autoConnect>{children}</SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
