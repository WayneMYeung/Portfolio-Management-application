// src/types/index.ts
// Shared TypeScript types across the application

export type Currency = 'USD' | 'HKD' | 'TWD' | 'CNY' | 'EUR' | 'GBP' | 'JPY' | 'SGD'

export type AssetType =
  | 'STOCK'
  | 'ETF'
  | 'CASH'
  | 'CRYPTO'
  | 'STRUCTURED'
  | 'TIME_DEPOSIT'

export interface Portfolio {
  id: string
  name: string
  ownerName: string
  baseCurrency: Currency
  description?: string | null
  createdAt: string
  updatedAt: string
  holdings: Holding[]
}

export interface Holding {
  id: string
  assetName: string
  ticker?: string | null
  assetType: AssetType
  quantity: number
  purchasePrice: number
  currency: Currency
  purchaseDate: string
  currentPrice?: number | null
  manualPrice?: number | null
  notes?: string | null
  isActive: boolean
  portfolioId: string
  createdAt: string
  updatedAt: string
}

// Computed holding with analytics
export interface HoldingWithAnalytics extends Holding {
  effectivePrice: number      // manualPrice ?? currentPrice ?? purchasePrice
  marketValue: number         // quantity * effectivePrice (in holding currency)
  marketValueBase: number     // converted to portfolio base currency
  costBasis: number           // quantity * purchasePrice (in holding currency)
  gainLoss: number            // marketValue - costBasis
  gainLossPct: number         // gainLoss / costBasis * 100
  allocationPct: number       // marketValueBase / totalPortfolioValue * 100
}

export interface PortfolioAnalytics {
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPct: number
  dailyChange: number
  dailyChangePct: number
  volatility: number
  history: { date: string; value: number }[]
  holdings: HoldingWithAnalytics[]
  allocationByType: { name: string; value: number; pct: number }[]
  currencyExposure: { currency: string; value: number; pct: number }[]
  topHoldings: HoldingWithAnalytics[]
  concentrationRisk: number   // top holding % of portfolio
}

export interface FxRates {
  base: Currency
  rates: Record<string, number>
  timestamp: number
}

export interface MarketPrice {
  ticker: string
  price: number
  currency: string
  change?: number
  changePct?: number
  source: 'yahoo' | 'manual' | 'cache'
}

export interface AiInsight {
  portfolioId: string
  content: string
  generatedAt: string
}

// API response wrappers
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
