'use client'

import { useRef, useState } from 'react'
import { UploadCloud, FileCheck2, RotateCcw, Loader2 } from 'lucide-react'
import { parseFeeCsv, type FeeRow } from '@/lib/fees'

export function CsvUpload({
  onData,
  onReset,
  onLoading,
  fileName,
  loading,
}: {
  onData: (rows: FeeRow[], name: string) => void
  onReset: () => void
  onLoading: (loading: boolean) => void
  fileName: string | null
  loading: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()

    reader.onload = async () => {
      const parsed = parseFeeCsv(String(reader.result ?? ''))
      if (!parsed) {
        setError("Couldn't read that one. Need a column with 'date' and 'fee'/'paid'.")
        return
      }

      onLoading(true)
      try {
        const res = await fetch('/api/prices/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: parsed }),
        })

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? 'Could not fetch live prices')
        }

        const data = (await res.json()) as { rows: FeeRow[] }
        onData(data.rows, file.name)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Price lookup failed. Try again in a moment.',
        )
      } finally {
        onLoading(false)
      }
    }

    reader.readAsText(file)
  }

  return (
    <div className="glass flex h-full flex-col rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">
            Upload Your History
          </h2>
          <p className="text-xs text-muted-foreground">
            Any chain in your CSV — priced per day, compared against Sui gas.
          </p>
        </div>
        {fileName && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              onReset()
              setError(null)
            }}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Sample data
          </button>
        )}
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          if (!loading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (loading) return
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
        className={[
          'flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all',
          loading ? 'pointer-events-none opacity-70' : '',
          dragging
            ? 'border-primary bg-primary/10 glow-purple'
            : 'border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        <span
          className={`flex size-12 items-center justify-center rounded-full ${
            loading
              ? 'bg-primary/15 text-primary'
              : fileName
                ? 'bg-success/15 text-success'
                : 'bg-primary/15 text-primary'
          }`}
        >
          {loading ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : fileName ? (
            <FileCheck2 className="size-6" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-6" aria-hidden="true" />
          )}
        </span>
        {loading ? (
          <div>
            <p className="font-medium text-foreground">Fetching live prices…</p>
            <p className="text-xs text-muted-foreground">
              Matching each transaction to its day&apos;s token price.
            </p>
          </div>
        ) : fileName ? (
          <div>
            <p className="font-medium text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">Priced with live market data.</p>
          </div>
        ) : (
          <div>
            <p className="font-medium text-foreground">
              Drag &amp; drop your CSV here
            </p>
            <p className="text-xs text-muted-foreground">or click to browse</p>
          </div>
        )}
      </label>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  )
}