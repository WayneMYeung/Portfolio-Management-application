// src/components/TransactionModal.tsx
import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calendar, DollarSign, PieChart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Holding } from '@/types'

interface Transaction {
  id: string
  type: string
  quantity: number
  price: number
  fees: number
  date: string
  notes?: string
}

export default function TransactionModal({
  holding,
  onClose,
  onUpdated,
}: {
  holding: Holding
  onClose: () => void
  onUpdated: () => void
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    type: 'BUY',
    quantity: 0,
    price: 0,
    fees: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetch(`/api/holdings/${holding.id}/transactions`)
      .then(r => r.json())
      .then(({ data }) => setTransactions(data ?? []))
      .finally(() => setLoading(false))
  }, [holding.id])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/holdings/${holding.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const { data } = await res.json()
        setTransactions([data, ...transactions])
        setShowAdd(false)
        setFormData({ ...formData, quantity: 0, price: 0, fees: 0, notes: '' })
        onUpdated()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
            <p className="text-sm text-slate-500">{holding.assetName} ({holding.ticker})</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showAdd ? (
          <form onSubmit={handleAdd} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                  <option value="DIVIDEND">DIVIDEND</option>
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  required
                  value={formData.quantity || ''}
                  onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Price ({holding.currency})</label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  required
                  value={formData.price || ''}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Fees</label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={formData.fees || ''}
                  onChange={e => setFormData({ ...formData, fees: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="label">Notes (Optional)</label>
              <textarea
                className="input"
                rows={2}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Add Transaction'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6">
            <button onClick={() => setShowAdd(true)} className="btn-primary w-full justify-center">
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          </div>
        )}

        <div className="overflow-y-auto max-h-[400px] rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No transactions found</td></tr>
              ) : transactions.map(t => {
                const total = (t.quantity * t.price) + t.fees
                return (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'BUY' ? 'bg-green-100 text-green-700' :
                        t.type === 'SELL' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{t.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(t.price, holding.currency)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatCurrency(total, holding.currency)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
