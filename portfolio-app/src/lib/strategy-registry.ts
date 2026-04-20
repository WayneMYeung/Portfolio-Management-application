import { InvestmentStrategy, StrategyBucket } from '@/types'

// Helper to construct a standard strategy definition quickly
const makeStrategy = (id: string, name: string, description: string, tree: StrategyBucket): InvestmentStrategy => ({
  id,
  name,
  description,
  isActive: false,
  portfolioId: 'PRESET', // Presets don't belong to a specific portfolio
  tree,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export const PRESET_STRATEGIES: InvestmentStrategy[] = [
  makeStrategy(
    'preset_60_40',
    'Classic 60/40',
    'The standard balanced portfolio: 60% Stocks, 40% Bonds.',
    {
      id: 'root',
      label: 'Classic 60/40',
      weight: 1.0,
      children: [
        { id: 'eq', label: 'Stocks', weight: 0.60, assetType: 'STOCK' },
        { id: 'bonds', label: 'Bonds', weight: 0.40, assetType: 'ETF' }, // Assuming bond ETFs
      ]
    }
  ),
  makeStrategy(
    'preset_all_weather',
    'All-Weather',
    'Designed by Ray Dalio to perform well in any economic environment.',
    {
      id: 'root',
      label: 'All-Weather',
      weight: 1.0,
      children: [
        { id: 'eq', label: 'Stocks', weight: 0.30, assetType: 'STOCK' },
        { id: 'ltb', label: 'Long-Term Bonds', weight: 0.40, assetType: 'ETF' },
        { id: 'mtb', label: 'Intermediate Bonds', weight: 0.15, assetType: 'ETF' },
        { 
          id: 'gold', 
          label: 'Gold / Metals', 
          weight: 0.075, 
          tickers: ['GLD', 'IAU', 'SLV', 'DBC'],
          keywords: ['Physical Gold', 'Physical Silver', 'Bullion', 'Metal']
        },
        { id: 'comm', label: 'Commodities', weight: 0.075, assetType: 'ETF' }
      ]
    }
  ),
  makeStrategy(
    'preset_core_satellite',
    'All-Weather Core + Satellite',
    '80% All-Weather core for stability, 20% Tactical Satellite for growth.',
    {
      id: 'root',
      label: 'Hybrid Strategy',
      weight: 1.0,
      children: [
        {
          id: 'core',
          label: 'Core (All-Weather)',
          weight: 0.80,
          children: [
            { id: 'c_eq', label: 'Core Stocks', weight: 0.30, assetType: 'STOCK' },
            { id: 'c_ltb', label: 'Long-Term Bonds', weight: 0.40, assetType: 'ETF' },
            { id: 'c_mtb', label: 'Intermediate Bonds', weight: 0.15, assetType: 'ETF' },
            { id: 'c_gold', label: 'Gold/Metals', weight: 0.075, tickers: ['GLD', 'IAU', 'SLV'], keywords: ['Gold', 'Metal'] },
            { id: 'c_comm', label: 'Commodities', weight: 0.075, assetType: 'ETF' }
          ]
        },
        {
          id: 'satellite',
          label: 'Tactical Satellite',
          weight: 0.20,
          children: [
            { id: 's_tech', label: 'Growth Tech', weight: 0.50, keywords: ['Nvidia', 'Tesla', 'Apple', 'Meta', 'Microsoft', 'AI', 'Technology'] },
            { id: 's_crypto', label: 'Crypto/Alts', weight: 0.50, assetType: 'CRYPTO', keywords: ['Bitcoin', 'Ethereum', 'Solana'] }
          ]
        }
      ]
    }
  ),
  makeStrategy(
    'preset_yale',
    'Yale Endowment (Simplified)',
    'Modeled after David Swensen\'s model focusing heavily on equities and alternatives.',
    {
      id: 'root',
      label: 'Yale Endowment',
      weight: 1.0,
      children: [
        { id: 'us_eq', label: 'US Equities', weight: 0.30, assetType: 'STOCK' },
        { id: 'intl_eq', label: 'International Equities', weight: 0.15, assetType: 'STOCK' },
        { id: 'abs_ret', label: 'Absolute Return / Alts', weight: 0.20, assetType: 'STRUCTURED', keywords: ['Hedge', 'Alpha', 'Absolute'] },
        { id: 'real_assets', label: 'Real Assets / RE', weight: 0.20, assetType: 'ETF', keywords: ['Real Estate', 'REIT', 'Property'] },
        { id: 'fixed_inc', label: 'Fixed Income', weight: 0.15, assetType: 'ETF' }
      ]
    }
  ),
  makeStrategy(
    'preset_100_eq',
    '100% Equity Growth',
    'Aggressive growth strategy fully invested in stocks.',
    {
      id: 'root',
      label: '100% Equity',
      weight: 1.0,
      children: [
        { id: 'eq', label: 'All Equities', weight: 1.0, assetType: 'STOCK' }
      ]
    }
  )
]

export function getPresets(): InvestmentStrategy[] {
  return [...PRESET_STRATEGIES]
}
