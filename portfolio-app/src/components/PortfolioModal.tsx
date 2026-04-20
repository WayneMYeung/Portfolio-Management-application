'use client'
// src/components/PortfolioModal.tsx
import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { CURRENCIES } from '@/lib/utils'
import type { Portfolio, Currency } from '@/types'

interface Props {
  portfolio: Portfolio | null
  onClose: () => void
  onSaved: () => void
}

export default function PortfolioModal({ portfolio, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: portfolio?.name ?? '',
    ownerName: portfolio?.ownerName ?? '',
    baseCurrency: portfolio?.baseCurrency ?? 'USD',
    description: portfolio?.description ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = portfolio ? `/api/portfolios/${portfolio.id}` : '/api/portfolios'
      const method = portfolio ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.toString() ?? 'Save failed')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-slide-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            {portfolio ? 'Edit Portfolio' : 'New Portfolio'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Portfolio Name *</label>
            <input
              className="input"
              placeholder="e.g. John's Growth Portfolio"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Owner Name *</label>
            <input
              className="input"
              placeholder="e.g. John"
              value={form.ownerName}
              onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Base Currency *</label>
            <select
              className="input"
              value={form.baseCurrency}
              onChange={e => setForm(f => ({ ...f, baseCurrency: e.target.value as Currency }))}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Optional notes about this portfolio..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : portfolio ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
