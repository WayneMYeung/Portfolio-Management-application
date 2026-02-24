'use client'
// src/app/(dashboard)/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Sparkles, RefreshCw } from 'lucide-react'
import { formatCurrency, formatPct, getGainLossColor, CHART_COLORS } from '@/lib/utils'
import AllocationChart from '@/components/charts/AllocationChart'
import CurrencyExposureChart from '@/components/charts/CurrencyExposureChart'
import TopHoldingsTable from '@/components/holdings/TopHoldingsTable'
import AiInsightsPanel from '@/components/AiInsightsPanel'
import PortfolioSelector from '@/components/PortfolioSelector'
import type { Portfolio, PortfolioAnalytics } from '@/types'

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/portfolios')
      .then(r => r.json())
      .then(({ data }) => {
        setPortfolios(data ?? [])
        if (data?.[0]) setSelectedId(data[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setAnalyticsLoading(true)
    fetch(`/api/analytics/${selectedId}`)
      .then(r => r.json())
      .then(({ data }) => setAnalytics(data))
      .finally(() => setAnalyticsLoading(false))
  }, [selectedId])

  const selectedPortfolio = portfolios.find(p => p.id === selectedId)

  if (loading) return <DashboardSkeleton />

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Briefcase className="w-12 h-12 text-slate-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No portfolios yet</p>
          <p className="text-sm text-slate-500">Create your first portfolio to get started</p>
        </div>
        <a href="/portfolios" className="btn-primary">Create Portfolio</a>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedPortfolio?.ownerName}'s portfolio overview
          </p>
        </div>
        <PortfolioSelector
          portfolios={portfolios}
          selectedId={selectedId}
          onChange={setSelectedId}
        />
      </div>

      {analyticsLoading ? (
        <div className="flex items-center gap-2 text-slate-500"><RefreshCw className="w-4 h-4 animate-spin" /> Loading analytics...</div>
      ) : analytics ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Value"
              value={formatCurrency(analytics.totalValue, selectedPortfolio?.baseCurrency)}
              icon={DollarSign}
              iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <KpiCard
              label="Total Gain/Loss"
              value={formatCurrency(analytics.totalGainLoss, selectedPortfolio?.baseCurrency)}
              subValue={formatPct(analytics.totalGainLossPct)}
              icon={analytics.totalGainLoss >= 0 ? TrendingUp : TrendingDown}
              iconColor={analytics.totalGainLoss >= 0
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}
              valueColor={getGainLossColor(analytics.totalGainLoss)}
            />
            <KpiCard
              label="Holdings"
              value={String(analytics.holdings.length)}
              icon={Briefcase}
              iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            />
            <KpiCard
              label="Concentration Risk"
              value={`${analytics.concentrationRisk.toFixed(1)}%`}
              subValue={analytics.concentrationRisk > 30 ? '⚠️ High' : '✅ OK'}
              icon={TrendingUp}
              iconColor={analytics.concentrationRisk > 30
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Asset Allocation</h2>
              </div>
              <div className="card-body">
                <AllocationChart data={analytics.allocationByType} currency={selectedPortfolio?.baseCurrency ?? 'USD'} />
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

          {/* Top Holdings */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Top Holdings</h2>
            </div>
            <div className="card-body p-0">
              <TopHoldingsTable holdings={analytics.topHoldings} currency={selectedPortfolio?.baseCurrency ?? 'USD'} />
            </div>
          </div>

          {/* AI Insights */}
          {selectedId && (
            <AiInsightsPanel portfolioId={selectedId} />
          )}
        </>
      ) : null}
    </div>
  )
}

function KpiCard({ label, value, subValue, icon: Icon, iconColor, valueColor }: {
  label: string; value: string; subValue?: string
  icon: React.ElementType; iconColor: string; valueColor?: string
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className={`text-xl font-bold mt-1 ${valueColor ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
          {subValue && <p className={`text-xs mt-0.5 ${valueColor ?? 'text-slate-500'}`}>{subValue}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 h-24 bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-72 bg-slate-100 dark:bg-slate-800" />
        <div className="card h-72 bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  )
}
