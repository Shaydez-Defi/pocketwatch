import { NextResponse } from 'next/server'
import type { ParsedCsvRow } from '@/lib/fees'
import { enrichParsedRows } from '@/lib/prices'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rows?: ParsedCsvRow[] }
    const rows = body.rows

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 })
    }

    const enriched = await enrichParsedRows(rows)
    return NextResponse.json({ rows: enriched })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Enrichment failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}