import { Transaction } from '@mysten/sui/transactions'
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'

export const SUI_NETWORK = 'testnet' as const

export const PACKAGE_ID =
  '0xe625ad69966b5d108431b24090a17d8e8024957e60576328719a0b3797e92274'

/** Shared object that aggregates savings across all users. */
export const SAVINGS_BOARD_ID =
  '0xc09ab88185533b830a99a83473cc2701f57ca43334d3f2293048bfb2a647d42f'

export const MODULE = 'fee_ledger'

/** localStorage key for the user's FeeLedger object id (created once, reused).
 *  Suffixed with the package so a redeploy never reuses a stale ledger id. */
export const LEDGER_STORAGE_KEY = `yeti-sui-ledger-id:${PACKAGE_ID.slice(0, 10)}`

/** Move stores USD as integer cents, so multiply by 100 and round. */
export function usdToU64(value: number): bigint {
  return BigInt(Math.round(Math.max(value, 0) * 100))
}

/** PTB that creates a fresh FeeLedger owned by the sender. */
export function buildCreateLedgerTx(): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::create_ledger`,
  })
  return tx
}

/** PTB that writes the latest analysis into an existing FeeLedger. */
export function buildSaveAnalysisTx(
  ledgerId: string,
  totalPaidUsd: number,
  suiEquivalentUsd: number,
  savingsUsd: number,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::save_analysis`,
    arguments: [
      tx.object(ledgerId),
      tx.object(SAVINGS_BOARD_ID),
      tx.pure.u64(usdToU64(totalPaidUsd)),
      tx.pure.u64(usdToU64(suiEquivalentUsd)),
      tx.pure.u64(usdToU64(savingsUsd)),
    ],
  })
  return tx
}

export type SavingsBoardStats = {
  totalSavedUsd: number
  totalAnalyses: number
  biggestSavingUsd: number
}

/** Read the shared SavingsBoard and convert cents back to USD. */
export async function fetchSavingsBoard(
  client: SuiJsonRpcClient,
): Promise<SavingsBoardStats> {
  const res = await client.getObject({
    id: SAVINGS_BOARD_ID,
    options: { showContent: true },
  })

  const content = res.data?.content
  if (!content || content.dataType !== 'moveObject') {
    throw new Error('Savings board not found.')
  }

  const fields = content.fields as {
    total_saved_usd: string
    total_analyses: string
    biggest_saving_usd: string
  }

  return {
    totalSavedUsd: Number(fields.total_saved_usd) / 100,
    totalAnalyses: Number(fields.total_analyses),
    biggestSavingUsd: Number(fields.biggest_saving_usd) / 100,
  }
}

export function loadLedgerId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LEDGER_STORAGE_KEY)
}

export function storeLedgerId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LEDGER_STORAGE_KEY, id)
}
