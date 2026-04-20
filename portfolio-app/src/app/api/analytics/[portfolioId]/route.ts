import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getFxRates } from '@/lib/fx-rates'
import { computePortfolioAnalytics } from '@/lib/analytics'
import { fetchMarketPrices, fetchHistoricalPrices } from '@/lib/market-data'

export async function GET(
  req: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: params.portfolioId, userId },
    include: {
      holdings: {
        where: { isActive: true },
        include: { transactions: true },
      }
    },
  })

  if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tickers = Array.from(new Set(portfolio.holdings.map(h => h.ticker).filter(Boolean))) as string[]
  
  // Fetch market data and history in parallel
  const [fxRates, marketDataMap, ...histories] = await Promise.all([
    getFxRates(portfolio.baseCurrency as any),
    fetchMarketPrices(tickers),
    ...tickers.map(t => fetchHistoricalPrices(t, 30))
  ])

  const historiesMap = new Map<string, { date: string; price: number }[]>()
  tickers.forEach((ticker, i) => {
    historiesMap.set(ticker.toUpperCase(), histories[i])
  })

  const analytics = computePortfolioAnalytics(
    portfolio.holdings as any,
    fxRates.rates,
    portfolio.baseCurrency,
    marketDataMap,
    historiesMap
  )

  return NextResponse.json({ data: analytics })
}
