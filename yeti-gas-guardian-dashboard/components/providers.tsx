'use client'

import type { ReactNode } from 'react'
import { SuiProviders } from '@/components/sui-provider'
import { WalletProvider } from '@/components/wallet-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SuiProviders>
      <WalletProvider>{children}</WalletProvider>
    </SuiProviders>
  )
}
