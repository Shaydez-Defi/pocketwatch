'use client'

import type { ReactNode } from 'react'
import { AppLaunchLoader } from '@/components/app-launch-loader'
import { SuiProviders } from '@/components/sui-provider'
import { WalletProvider } from '@/components/wallet-provider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SuiProviders>
      <WalletProvider>
        <AppLaunchLoader />
        {children}
      </WalletProvider>
    </SuiProviders>
  )
}
