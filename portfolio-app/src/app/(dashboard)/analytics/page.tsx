'use client'
// src/app/(dashboard)/analytics/page.tsx
import { useEffect, useState } from 'react'
import { BarChart3, AlertTriangle, TrendingUp, PieChart, DollarSign } from 'lucide-react'
import { formatCurrency, formatPct, getGainLossColor, CHART_COLORS } from '@/lib/utils'
import type { Portfolio, PortfolioAnalytics } from '@/types'
import AllocationChart from '@/components/charts/AllocationChart'
import CurrencyExposureChart from '@/components/charts/CurrencyExposureChart'
import PortfolioSelector from '@/components/PortfolioSelector'
import AiInsightsPanel from '@/components/AiInsightsPanel'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function AnalyticsPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portfolios').then(r => r.json()).then(({ data }) => {
      setPortfolios(data ?? [])
      if (data?.[0]) setSelectedId(data[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    fetch(`/api/analytics/${selectedId}`)
      .then(r => r.json())
      .then(({ data }) => setAnalytics(data))
  }, [selectedId])

  const selectedPortfolio = portfolios.find(p => p.id === selectedId)
  const currency = selectedPortfolio?.baseCurrency ?? 'USD'

  // Prepare bar chart data for top holdings
  const barData = analytics?.topHoldings.slice(0, 10).map(h => ({
    name: h.ticker ?? h.assetName.slice(0, 12),
    value: h.marketValueBase,
    gainLossPct: h.gainLossPct,
  })) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500">Deep portfolio analysis</p>
        </div>
        <PortfolioSelector portfolios={portfolios} selectedId={selectedId} onChange={setSelectedId} />
      </div>

      {!analytics ? (
        <div className="flex items-center justify-center h-48 text-slate-400">Select a portfolio to view analytics</div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Value', value: formatCurrency(analytics.totalValue, currency), icon: DollarSign, color: 'blue' },
              { label: 'Total Return', value: formatPct(analytics.totalGainLossPct), icon: TrendingUp, color: analytics.totalGainLoss >= 0 ? 'green' : 'red' },
              { label: 'Positions', value: String(analytics.holdings.length), icon: PieChart, color: 'purple' },
              { label: 'Concentration', value: `${analytics.concentrationRisk.toFixed(1)}%`, icon: AlertTriangle, color: analytics.concentrationRisk > 30 ? 'amber' : 'green' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-bold mt-1 text-${color}-600 dark:text-${color}-400`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Concentration Risk Alert */}
          {analytics.concentrationRisk > 30 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">High Concentration Risk</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  Your top holding represents {analytics.concentrationRisk.toFixed(1)}% of the portfolio.
                  Consider diversifying to reduce single-asset risk.
                </p>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Asset Allocation</h2>
              </div>
              <div className="card-body">
                <AllocationChart data={analytics.allocationByType} currency={currency} />
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Currency Exposure</h2>
              </div>
              <div className="card-body">
                <CurrencyExposureChart data={analytics.currencyExposure} />
              </div>
            </div>
          </div>

          {/* Holdings Performance Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Top Holdings by Value ({currency})</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v, currency)}
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Holdings Table */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Full Holdings Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th className="text-right">Value ({currency})</th>
                    <th className="text-right">Allocation</th>
                    <th className="text-right">Gain/Loss</th>
                    <th className="text-right">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.holdings
                    .sort((a, b) => b.marketValueBase - a.marketValueBase)
                    .map(h => (
                      <tr key={h.id}>
                        <td>
                          <div>
                            <p className="font-medium text-sm">{h.assetName}</p>
                            {h.ticker && <p className="font-mono text-xs text-blue-500">{h.ticker}</p>}
                          </div>
                        </td>
                        <td className="text-right font-mono text-sm">{formatCurrency(h.marketValueBase, currency)}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(h.allocationPct, 100)}%` }} />
                            </div>
                            <span className="text-sm tabular-nums">{h.allocationPct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className={`text-right text-sm font-mono ${getGainLossColor(h.gainLoss)}`}>
                          {formatCurrency(h.gainLoss, currency)}
                        </td>
                        <td className={`text-right text-sm font-medium ${getGainLossColor(h.gainLossPct)}`}>
                          {formatPct(h.gainLossPct)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights */}
          {selectedId && <AiInsightsPanel portfolioId={selectedId} />}
        </>
      )}
    </div>
  )
}
