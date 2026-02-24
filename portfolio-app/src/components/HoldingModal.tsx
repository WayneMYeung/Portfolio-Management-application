'use client'
// src/components/HoldingModal.tsx
import { useState, useEffect } from 'react'
import { X, Save, Search, Loader2 } from 'lucide-react'
import { CURRENCIES, ASSET_TYPES, getAssetTypeLabel } from '@/lib/utils'
import type { Holding, Portfolio } from '@/types'

interface Props {
  holding: Holding | null
  portfolios: Portfolio[]
  defaultPortfolioId?: string
  onClose: () => void
  onSaved: () => void
}

const DEFAULT_FORM = {
  portfolioId: '',
  assetName: '',
  ticker: '',
  assetType: 'STOCK',
  quantity: '',
  purchasePrice: '',
  currency: 'USD',
  purchaseDate: new Date().toISOString().split('T')[0],
  manualPrice: '',
  notes: '',
}

export default function HoldingModal({ holding, portfolios, defaultPortfolioId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    portfolioId: (defaultPortfolioId || portfolios[0]?.id) ?? '',
    ...(holding ? {
      portfolioId: holding.portfolioId,
      assetName: holding.assetName,
      ticker: holding.ticker ?? '',
      assetType: holding.assetType,
      quantity: String(holding.quantity),
      purchasePrice: String(holding.purchasePrice),
      currency: holding.currency,
      purchaseDate: new Date(holding.purchaseDate).toISOString().split('T')[0],
      manualPrice: String(holding.manualPrice ?? ''),
      notes: holding.notes ?? '',
    } : {}),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [fetchedPrice, setFetchedPrice] = useState<number | null>(null)

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  const lookupTicker = async () => {
    if (!form.ticker) return
    setFetchingPrice(true)
    try {
      const res = await fetch(`/api/market-data?ticker=${encodeURIComponent(form.ticker)}`)
      const { data } = await res.json()
      if (data?.price) {
        setFetchedPrice(data.price)
        setForm(prev => ({ ...prev, currency: data.currency ?? prev.currency }))
      }
    } catch {
    } finally {
      setFetchingPrice(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      portfolioId: form.portfolioId,
      assetName: form.assetName,
      ticker: form.ticker || null,
      assetType: form.assetType,
      quantity: parseFloat(form.quantity),
      purchasePrice: parseFloat(form.purchasePrice),
      currency: form.currency,
      purchaseDate: new Date(form.purchaseDate).toISOString(),
      manualPrice: form.manualPrice ? parseFloat(form.manualPrice) : null,
      notes: form.notes || null,
    }

    try {
      const url = holding ? `/api/holdings/${holding.id}` : '/api/holdings'
      const method = holding ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(JSON.stringify(data.error) ?? 'Save failed')
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
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 z-10">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
            {holding ? 'Edit Holding' : 'Add Holding'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Portfolio */}
          <div>
            <label className="label">Portfolio *</label>
            <select className="input" value={form.portfolioId} onChange={f('portfolioId')} required>
              {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Asset Type */}
            <div>
              <label className="label">Asset Type *</label>
              <select className="input" value={form.assetType} onChange={f('assetType')} required>
                {ASSET_TYPES.map(t => <option key={t} value={t}>{getAssetTypeLabel(t)}</option>)}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="label">Currency *</label>
              <select className="input" value={form.currency} onChange={f('currency')} required>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Asset Name */}
          <div>
            <label className="label">Asset Name *</label>
            <input
              className="input"
              placeholder="e.g. Apple Inc."
              value={form.assetName}
              onChange={f('assetName')}
              required
            />
          </div>

          {/* Ticker with lookup */}
          <div>
            <label className="label">Ticker Symbol (optional)</label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="e.g. AAPL, BTC-USD"
                value={form.ticker}
                onChange={f('ticker')}
              />
              <button
                type="button"
                onClick={lookupTicker}
                disabled={!form.ticker || fetchingPrice}
                className="btn-secondary shrink-0"
                title="Look up current price"
              >
                {fetchingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            {fetchedPrice && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ Current price: {fetchedPrice.toFixed(2)} {form.currency}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="label">Quantity *</label>
              <input
                className="input"
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={form.quantity}
                onChange={f('quantity')}
                required
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="label">Purchase Price *</label>
              <input
                className="input"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.purchasePrice}
                onChange={f('purchasePrice')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Purchase Date */}
            <div>
              <label className="label">Purchase Date *</label>
              <input
                className="input"
                type="date"
                value={form.purchaseDate}
                onChange={f('purchaseDate')}
                required
              />
            </div>

            {/* Manual Price Override */}
            <div>
              <label className="label">Manual Price Override</label>
              <input
                className="input"
                type="number"
                step="any"
                min="0"
                placeholder="Leave blank for auto"
                value={form.manualPrice}
                onChange={f('manualPrice')}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Optional notes..."
              value={form.notes}
              onChange={f('notes')}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : holding ? 'Update' : 'Add Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
