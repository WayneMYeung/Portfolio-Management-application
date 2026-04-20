'use client'

import { useEffect, useState } from 'react'
import { InvestmentStrategy, DriftReport, Portfolio } from '@/types'
import { Target, RefreshCw, AlertCircle } from 'lucide-react'
import StrategyCard from '@/components/strategy/StrategyCard'
import DriftChart from '@/components/strategy/DriftChart'
import TradeOrdersTable from '@/components/strategy/TradeOrdersTable'
import PortfolioSelector from '@/components/PortfolioSelector'

export default function StrategiesPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  
  const [strategies, setStrategies] = useState<InvestmentStrategy[]>([])
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null)
  
  const [selectedStrategy, setSelectedStrategy] = useState<InvestmentStrategy | null>(null)
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 1. Initial Load: Portfolios
  useEffect(() => {
    fetch('/api/portfolios')
      .then(r => r.json())
      .then(({ data }) => {
        setPortfolios(data ?? [])
        if (data?.[0]) setSelectedPortfolioId(data[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  // 2. When portfolio changes, load strategies and active strategy
  useEffect(() => {
    if (!selectedPortfolioId) return
    loadStrategies(selectedPortfolioId)
  }, [selectedPortfolioId])

  const loadStrategies = async (portfolioId: string) => {
    try {
      setErrorMessage(null)
      // Get all available strategies (presets + custom)
      const res = await fetch(`/api/strategies?portfolioId=${portfolioId}`).then(r => r.json())
      const allStrategies = [...(res.data?.presets || []), ...(res.data?.custom || [])]
      setStrategies(allStrategies)

      // Get active strategy for this portfolio
      const activeRes = await fetch(`/api/strategies/active?portfolioId=${portfolioId}`).then(r => r.json())
      const activeStr = activeRes.data
      
      if (activeStr) {
        setActiveStrategyId(activeStr.id)
        // Auto-select the active strategy to evaluate
        const toSelect = allStrategies.find(s => s.name === activeStr.name) || activeStr
        setSelectedStrategy(toSelect)
      } else if (allStrategies.length > 0) {
        setActiveStrategyId(null)
        setSelectedStrategy(allStrategies[0])
      }
    } catch (e: any) {
      console.error("Failed to load strategies", e)
      setErrorMessage("Failed to load strategies.")
    }
  }

  // 3. When selected strategy changes, run evaluation
  useEffect(() => {
    if (!selectedPortfolioId || !selectedStrategy) return
    
    setEvaluating(true)
    setErrorMessage(null)
    fetch('/api/strategies/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolioId: selectedPortfolioId,
        strategy: selectedStrategy
      })
    })
      .then(r => r.json())
      .then(res => {
        if (res.error) throw new Error(res.error)
        setDriftReport(res.data)
      })
      .catch(e => {
        setErrorMessage(`Evaluation Failed: ${e.message}`)
        setDriftReport(null)
      })
      .finally(() => setEvaluating(false))
  }, [selectedStrategy, selectedPortfolioId])

  const handleActivateStrategy = async (strategy: InvestmentStrategy) => {
    if (!selectedPortfolioId) return
    
    try {
      setErrorMessage(null)
      // Determine if it's a built-in preset (has no real portfolioId in DB yet)
      const isPreset = strategy.portfolioId === 'PRESET'

      const res = await fetch('/api/strategies/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolioId,
          strategyId: strategy.id,
          isPreset
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to activate strategy')
      }
      
      alert(`${strategy.name} is now targeting this portfolio.`)
      loadStrategies(selectedPortfolioId) // Reload to get fresh DB states
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to update strategy")
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Strategy Lab...</div>

  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId)

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Strategy Lab</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Design allocations and calculate drift</p>
          </div>
        </div>
        <PortfolioSelector
          portfolios={portfolios}
          selectedId={selectedPortfolioId}
          onChange={setSelectedPortfolioId}
        />
      </div>

      {!selectedPortfolioId ? (
        <div className="card p-8 text-center text-slate-500">Please create or select a portfolio.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: Strategy Selection */}
          <div className="xl:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Model Portfolios</h2>
            {strategies.map(s => (
               <StrategyCard 
                 key={s.id} 
                 strategy={s} 
                 isSelected={selectedStrategy?.id === s.id}
                 isActive={Boolean((activeStrategyId === s.id) || (s.portfolioId === 'PRESET' && activeStrategyId && strategies.find(act => act.id === activeStrategyId)?.name === s.name))}
                 onSelect={setSelectedStrategy}
                 onActivate={handleActivateStrategy}
               />
            ))}
          </div>

          {/* Right Column: Visualization & Trades */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Drift Chart Card */}
            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">Portfolio Drift vs. Target</h2>
                  {selectedStrategy && (
                     <p className="text-xs text-slate-500 mt-1">If you switched to <span className="font-bold text-slate-700 dark:text-slate-300">{selectedStrategy.name}</span> today</p>
                  )}
                </div>
                {evaluating && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
              </div>
              <div className="card-body">
                {driftReport ? (
                  <DriftChart data={driftReport.items} currency={selectedPortfolio?.baseCurrency || 'USD'} />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-slate-400 gap-2">
                    <AlertCircle className="w-5 h-5"/> Select a strategy to view drift
                  </div>
                )}
              </div>
            </div>

            {/* Trade Orders Card */}
            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Rebalancing Trades</h2>
                <p className="text-xs text-slate-500 mt-1">Suggested actions to align your current holdings with the target strategy.</p>
              </div>
              <div className="card-body p-0">
                {driftReport ? (
                  <TradeOrdersTable orders={driftReport.tradeOrders} currency={selectedPortfolio?.baseCurrency || 'USD'} />
                ) : (
                  <div className="p-8 text-center text-slate-400">Waiting for strategy selection...</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
