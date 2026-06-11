'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  connectBrowserWallet,
  detectAddressKind,
  getEthereumProvider,
  normalizeAddress,
} from '@/lib/wallet'

const STORAGE_KEY = 'yeti-tracked-wallets'

type WalletContextValue = {
  wallets: string[]
  connectWallet: () => Promise<void>
  addWallet: (address: string) => void
  removeWallet: (address: string) => void
  isConnecting: boolean
  error: string | null
  clearError: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

function loadWallets(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return parsed
      .filter((a) => detectAddressKind(a) !== null)
      .map((a) => normalizeAddress(a))
  } catch {
    return []
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<string[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setWallets(loadWallets())
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets))
  }, [wallets])

  const addWallet = useCallback((address: string) => {
    if (detectAddressKind(address) === null) {
      setError(
        'Unsupported address. Use an EVM (0x…), Solana, or Tron (T…) address.',
      )
      return
    }
    const normalized = normalizeAddress(address)
    setWallets((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized],
    )
    setError(null)
  }, [])

  const removeWallet = useCallback((address: string) => {
    const normalized = normalizeAddress(address)
    setWallets((prev) => prev.filter((w) => w !== normalized))
  }, [])

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const accounts = await connectBrowserWallet()
      for (const account of accounts) addWallet(account)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection failed.')
    } finally {
      setIsConnecting(false)
    }
  }, [addWallet])

  useEffect(() => {
    const provider = getEthereumProvider()
    if (!provider?.on) return

    const onAccountsChanged = (accounts: unknown) => {
      if (!Array.isArray(accounts) || !accounts.length) return
      for (const account of accounts) {
        if (typeof account === 'string') addWallet(account)
      }
    }

    provider.on('accountsChanged', onAccountsChanged)
    return () => provider.removeListener?.('accountsChanged', onAccountsChanged)
  }, [addWallet])

  const value = useMemo(
    () => ({
      wallets,
      connectWallet,
      addWallet,
      removeWallet,
      isConnecting,
      error,
      clearError: () => setError(null),
    }),
    [wallets, connectWallet, addWallet, removeWallet, isConnecting, error],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallets() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallets must be used inside WalletProvider')
  return ctx
}