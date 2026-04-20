import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { StrategyEvaluator } from '@/lib/strategy-evaluator'
import { getFxRates } from '@/lib/fx-rates'
import { computePortfolioAnalytics } from '@/lib/analytics'
import { fetchMarketPrices, fetchHistoricalPrices } from '@/lib/market-data'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { portfolioId, strategy } = body

  if (!portfolioId || !strategy) {
    return NextResponse.json({ error: 'Missing portfolioId or strategy' }, { status: 400 })
  }

  // 1. Load portfolio and holdings
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId: (session.user as any).id },
    include: {
      holdings: {
        where: { isActive: true },
        include: { transactions: true }
      }
    }
  })

  if (!portfolio) {
    return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
  }

  // 2. We need the current analytics (specifically holdings with their current market values)
  const tickers = Array.from(new Set(portfolio.holdings.map(h => h.ticker).filter(Boolean))) as string[]
  
  const [fxRates, marketDataMap] = await Promise.all([
    getFxRates(portfolio.baseCurrency as any),
    fetchMarketPrices(tickers)
  ])

  const analytics = computePortfolioAnalytics(
    portfolio.holdings as any,
    fxRates.rates,
    portfolio.baseCurrency,
    marketDataMap,
    new Map() // Historical prices not strictly needed for drift
  )

  // 3. Evaluate the strategy
  const driftReport = StrategyEvaluator.evaluate(
    analytics.holdings,
    strategy,
    analytics.totalValue
  )

  return NextResponse.json({ data: driftReport })
}
