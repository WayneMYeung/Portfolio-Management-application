'use client'
// src/app/(dashboard)/holdings/page.tsx
import { Suspense, useEffect, useState } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { formatCurrency, formatPct, getGainLossColor, getAssetTypeLabel, ASSET_TYPES } from '@/lib/utils'
import type { Holding, Portfolio } from '@/types'
import HoldingModal from '@/components/HoldingModal'
import TransactionModal from '@/components/TransactionModal'
import { useSearchParams } from 'next/navigation'
import { List } from 'lucide-react'

function HoldingsContent() {
  const searchParams = useSearchParams()
  const defaultPortfolioId = searchParams.get('portfolio')

  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPortfolio, setFilterPortfolio] = useState(defaultPortfolioId ?? '')
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null)
  const [transactionHolding, setTransactionHolding] = useState<Holding | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetch('/api/portfolios').then(r => r.json()).then(({ data }) => setPortfolios(data ?? []))
  }, [])

  const loadHoldings = () => {
    const params = filterPortfolio ? `?portfolioId=${filterPortfolio}` : ''
    setLoading(true)
    fetch(`/api/holdings${params}`)
      .then(r => r.json())
      .then(({ data }) => setHoldings(data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadHoldings() }, [filterPortfolio])

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this holding?')) return
    await fetch(`/api/holdings/${id}`, { method: 'DELETE' })
    setHoldings(h => h.filter(x => x.id !== id))
  }

  const refreshPrices = async () => {
    setRefreshing(true)
    await fetch('/api/market-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolioId: filterPortfolio || undefined }),
    })
    loadHoldings()
    setRefreshing(false)
  }

  const filtered = holdings.filter(h => {
    const matchSearch = !search || h.assetName.toLowerCase().includes(search.toLowerCase()) ||
      h.ticker?.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || h.assetType === filterType
    return matchSearch && matchType
  })

  const getPortfolioName = (id: string) => portfolios.find(p => p.id === id)?.name ?? '-'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Holdings</h1>
          <p className="text-sm text-slate-500">{filtered.length} positions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refreshPrices} disabled={refreshing} className="btn-secondary">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh Prices
          </button>
          <button onClick={() => { setEditingHolding(null); setModalOpen(portfolios.length > 0) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Holding
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or ticker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={filterPortfolio}
          onChange={e => setFilterPortfolio(e.target.value)}
        >
          <option value="">All Portfolios</option>
          {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {ASSET_TYPES.map(t => <option key={t} value={t}>{getAssetTypeLabel(t)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-left">Asset</th>
                <th className="text-left">Portfolio</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Avg Cost</th>
                <th className="text-right">Current</th>
                <th className="text-right">Value</th>
                <th className="text-right">Gain/Loss</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="text-left"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    <td className="text-left"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    <td className="text-right"><div className="h-4 w-12 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    <td className="text-right"><div className="h-4 w-20 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    <td className="text-right"><div className="h-4 w-20 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    <td className="text-right"><div className="h-4 w-24 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    <td className="text-right"><div className="h-4 w-16 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    <td className="text-right"><div className="h-4 w-12 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No holdings found
                  </td>
                </tr>
              ) : filtered.map(h => {
                const effectivePrice = h.manualPrice ?? h.currentPrice ?? h.purchasePrice
                const value = h.quantity * effectivePrice
                const costBasis = h.quantity * h.purchasePrice
                const gainLoss = value - costBasis
                const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

                return (
                  <tr key={h.id}>
                    <td className="text-left">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{h.assetName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {h.ticker && <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">{h.ticker}</span>}
                            <span className={`badge badge-${h.assetType.toLowerCase()}`}>{getAssetTypeLabel(h.assetType)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-left text-sm text-slate-500 dark:text-slate-400 font-medium">{getPortfolioName(h.portfolioId)}</td>
                    <td className="text-right text-sm font-mono tabular-nums">{h.quantity.toLocaleString()}</td>
                    <td className="text-right text-sm font-mono tabular-nums">{formatCurrency(h.purchasePrice, h.currency)}</td>
                    <td className="text-right text-sm font-mono tabular-nums">
                      {formatCurrency(effectivePrice, h.currency)}
                      {h.manualPrice && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded ml-1">M</span>}
                    </td>
                    <td className="text-right text-sm font-bold tabular-nums">{formatCurrency(value, h.currency)}</td>
                    <td className="text-right">
                      <span className={`text-sm font-bold tabular-nums ${getGainLossColor(gainLoss)}`}>
                        {formatPct(gainLossPct)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setTransactionHolding(h)} className="btn-ghost p-1.5 text-blue-600" title="Transactions">
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setEditingHolding(h); setModalOpen(true) }} className="btn-ghost p-1.5">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(h.id)} className="btn-ghost p-1.5 text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <HoldingModal
          holding={editingHolding}
          portfolios={portfolios}
          defaultPortfolioId={filterPortfolio || portfolios[0]?.id || ''}
          onClose={() => setModalOpen(false)}
          onSaved={loadHoldings}
        />
      )}
      
      {transactionHolding && (
        <TransactionModal
          holding={transactionHolding}
          onClose={() => setTransactionHolding(null)}
          onUpdated={loadHoldings}
        />
      )}
    </div>
  )
}

export default function HoldingsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />}>
      <HoldingsContent />
    </Suspense>
  )
}
