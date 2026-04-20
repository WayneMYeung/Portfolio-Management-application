// src/lib/analytics.ts
// Core portfolio analytics: value, gain/loss, allocation, volatility

import type { Holding, HoldingWithAnalytics, PortfolioAnalytics } from '@/types'
import { convertCurrency } from './fx-rates'

/**
 * Compute full portfolio analytics given holdings, FX rates, and base currency.
 */
export function computePortfolioAnalytics(
  holdings: Holding[],
  fxRates: Record<string, number>,
  baseCurrency: string,
  marketDataMap: Map<string, { change?: number }> = new Map(),
  priceHistories: Map<string, { date: string; price: number }[]> = new Map()
): PortfolioAnalytics {
  const active = holdings.filter(h => h.isActive)

  let totalDailyChangeBase = 0

  // Compute per-holding analytics
  const withAnalytics: HoldingWithAnalytics[] = active.map(h => {
    const effectivePrice = h.manualPrice ?? h.currentPrice ?? h.purchasePrice
    const marketValue = h.quantity * effectivePrice
    const costBasis = h.quantity * h.purchasePrice
    const gainLoss = marketValue - costBasis
    const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

    // Convert to base currency for portfolio-level aggregation
    const marketValueBase = convertCurrency(marketValue, h.currency, baseCurrency, fxRates)
    const costBasisBase = convertCurrency(costBasis, h.currency, baseCurrency, fxRates)

    // Calculate daily change
    const ticker = h.ticker?.toUpperCase()
    const changePerUnit = (ticker && marketDataMap.get(ticker)?.change) || 0
    const dailyChangeHolding = h.quantity * changePerUnit
    const dailyChangeBase = convertCurrency(dailyChangeHolding, h.currency, baseCurrency, fxRates)
    totalDailyChangeBase += dailyChangeBase

    return {
      ...h,
      effectivePrice,
      marketValue,
      marketValueBase,
      costBasis: costBasisBase,
      gainLoss: marketValueBase - costBasisBase,
      gainLossPct,
      allocationPct: 0, // set after total is known
    }
  })

  const totalValue = withAnalytics.reduce((sum, h) => sum + h.marketValueBase, 0)
  const totalCost = withAnalytics.reduce((sum, h) => sum + h.costBasis, 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0
  
  const prevValue = totalValue - totalDailyChangeBase
  const dailyChangePct = prevValue > 0 ? (totalDailyChangeBase / prevValue) * 100 : 0

  // Set allocation percentages
  withAnalytics.forEach(h => {
    h.allocationPct = totalValue > 0 ? (h.marketValueBase / totalValue) * 100 : 0
  })

  // Allocation by asset type
  const typeMap = new Map<string, number>()
  for (const h of withAnalytics) {
    typeMap.set(h.assetType, (typeMap.get(h.assetType) ?? 0) + h.marketValueBase)
  }
  const allocationByType = Array.from(typeMap.entries()).map(([name, value]) => ({
    name: formatAssetType(name),
    value,
    pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }))

  // Currency exposure
  const currencyMap = new Map<string, number>()
  for (const h of withAnalytics) {
    currencyMap.set(h.currency, (currencyMap.get(h.currency) ?? 0) + h.marketValueBase)
  }
  const currencyExposure = Array.from(currencyMap.entries()).map(([currency, value]) => ({
    currency,
    value,
    pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }))

  // Top holdings by value
  const topHoldings = [...withAnalytics]
    .sort((a, b) => b.marketValueBase - a.marketValueBase)
    .slice(0, 10)

  // Concentration risk = largest single holding %
  const concentrationRisk = withAnalytics.length > 0
    ? Math.max(...withAnalytics.map(h => h.allocationPct))
    : 0

  // Volatility - weighted average of individual volatilities
  let weightedVol = 0
  let totalWeight = 0
  for (const h of withAnalytics) {
    const history = h.ticker ? priceHistories.get(h.ticker.toUpperCase()) : null
    if (history && history.length >= 10) {
      const vol = estimateVolatility(history.map(p => p.price))
      weightedVol += vol * h.marketValueBase
      totalWeight += h.marketValueBase
    }
  }
  const volatility = totalWeight > 0 ? weightedVol / totalWeight : 0

  // Compute historical value series by aggregating individual ticker histories
  const dateValueMap = new Map<string, number>()
  
  for (const h of withAnalytics) {
    if (!h.ticker) continue
    const series = priceHistories.get(h.ticker.toUpperCase())
    if (!series) continue

    const transactions = (h as any).transactions as any[] || []

    for (const point of series) {
      const date = new Date(point.date)
      const qtyAtDate = getQuantityAtDate(transactions, date)
      if (qtyAtDate <= 0) continue

      const valBase = convertCurrency(point.price * qtyAtDate, h.currency, baseCurrency, fxRates)
      dateValueMap.set(point.date, (dateValueMap.get(point.date) ?? 0) + valBase)
    }
  }

  const history = Array.from(dateValueMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPct,
    dailyChange: totalDailyChangeBase,
    dailyChangePct,
    volatility,
    history,
    holdings: withAnalytics,
    allocationByType,
    currencyExposure,
    topHoldings,
    concentrationRisk,
  }
}

/**
 * Calculates the total quantity of an asset at a specific point in time.
 */
function getQuantityAtDate(transactions: any[], date: Date): number {
  let qty = 0
  for (const t of transactions) {
    const tDate = new Date(t.date)
    if (tDate <= date) {
      if (t.type === 'BUY') qty += t.quantity
      else if (t.type === 'SELL') qty -= t.quantity
    }
  }
  return qty
}

/**
 * Estimate portfolio volatility (annualized std dev) from daily price history.
 * Simple implementation: std dev of daily returns * sqrt(252).
 */
export function estimateVolatility(prices: number[]): number {
  if (prices.length < 10) return 0

  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]))
    }
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(252) * 100 // annualized %
}

function formatAssetType(type: string): string {
  const map: Record<string, string> = {
    STOCK: 'Stocks',
    ETF: 'ETFs',
    CASH: 'Cash',
    CRYPTO: 'Crypto',
    STRUCTURED: 'Structured',
    TIME_DEPOSIT: 'Time Deposits',
  }
  return map[type] ?? type
}
