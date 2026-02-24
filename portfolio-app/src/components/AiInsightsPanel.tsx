'use client'
// src/components/AiInsightsPanel.tsx
import { useState } from 'react'
import { Sparkles, RefreshCw, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  portfolioId: string
}

export default function AiInsightsPanel({ portfolioId }: Props) {
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [cached, setCached] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId }),
      })
      const { data } = await res.json()
      setInsights(data.content)
      setGeneratedAt(data.generatedAt)
      setCached(data.cached)
      setExpanded(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">AI Insights</h2>
          {cached && (
            <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-xs">cached</span>
          )}
        </div>
        {insights && (
          <button onClick={() => setExpanded(!expanded)} className="btn-ghost p-1.5">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="card-body">
        {!insights ? (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <p className="text-sm text-slate-500 text-center max-w-xs">
              Get AI-powered analysis of your portfolio's diversification, risk, and improvement suggestions.
            </p>
            <button onClick={generate} disabled={loading} className="btn-primary gap-2">
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Insights</>
              )}
            </button>
          </div>
        ) : (
          <>
            {expanded && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {insights}
                </pre>
              </div>
            )}
            {generatedAt && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(generatedAt).toLocaleString()}
                </div>
                <button onClick={generate} disabled={loading} className="btn-ghost text-xs py-1">
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
