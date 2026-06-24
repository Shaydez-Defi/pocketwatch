'use client'

import { useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { answerAnalystQuestion } from '@/lib/insights'
import type { PocketWatchInsights } from '@/lib/insights'

const SUGGESTIONS = [
  'Explain my behavior',
  'Why are my fees so high?',
  'What kind of user am I?',
  'Which chain do I rely on most?',
]

export function OnchainAnalyst({ insights }: { insights: PocketWatchInsights }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(insights.analystBullets[0] ?? '')

  function ask(q: string) {
    setQuestion(q)
    setAnswer(answerAnalystQuestion(q, insights))
  }

  return (
    <div className="glass glow-purple rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Onchain Analyst</h2>
          <p className="text-[11px] text-muted-foreground">
            Friendly accountant energy, not a chatbot
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => ask(s)}
            className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (question.trim()) ask(question.trim())
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your gas habits…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />
        <button
          type="submit"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground/90">
        {answer}
      </div>

      <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
        {insights.analystBullets.slice(1, 4).map((b) => (
          <li key={b.slice(0, 40)} className="text-xs leading-relaxed text-muted-foreground">
            · {b}
          </li>
        ))}
      </ul>
    </div>
  )
}