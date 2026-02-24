'use client'
// src/app/(dashboard)/portfolios/page.tsx
import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Briefcase, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Portfolio } from '@/types'
import PortfolioModal from '@/components/PortfolioModal'

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    fetch('/api/portfolios')
      .then(r => r.json())
      .then(({ data }) => setPortfolios(data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio and all its holdings?')) return
    setDeleting(id)
    await fetch(`/api/portfolios/${id}`, { method: 'DELETE' })
    setPortfolios(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  const openCreate = () => { setEditingPortfolio(null); setModalOpen(true) }
  const openEdit = (p: Portfolio) => { setEditingPortfolio(p); setModalOpen(true) }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portfolios</h1>
          <p className="text-sm text-slate-500">Manage family investment portfolios</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Portfolio
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 card">
          <Briefcase className="w-12 h-12 text-slate-400" />
          <p className="text-slate-500">No portfolios yet. Create one to get started.</p>
          <button onClick={openCreate} className="btn-primary">Create Portfolio</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map(p => {
            const holdingCount = p.holdings?.length ?? 0
            const totalValue = p.holdings?.reduce((sum, h) => sum + (h.quantity * ((h.manualPrice ?? h.currentPrice ?? h.purchasePrice))), 0) ?? 0

            return (
              <div key={p.id} className="card p-5 group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.ownerName}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="btn-ghost p-1.5 text-red-500 hover:text-red-600"
                    ><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Base Currency</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{p.baseCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Holdings</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{holdingCount}</span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-slate-400 mt-2 truncate">{p.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <a href={`/holdings?portfolio=${p.id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> View Holdings
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <PortfolioModal
          portfolio={editingPortfolio}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}
