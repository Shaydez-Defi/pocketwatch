import { NextResponse } from 'next/server'
import { fetchWalletTransactions } from '@/lib/explorer'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { addresses?: string[] }
    const addresses = body.addresses

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json({ error: 'addresses array required' }, { status: 400 })
    }

    const result = await fetchWalletTransactions(addresses)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wallet fetch failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}