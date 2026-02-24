// src/app/api/market-data/route.ts
// Fetches current prices and refreshes holdings in DB

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { fetchMarketPrices } from '@/lib/market-data'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { portfolioId } = await req.json()

  // Get all holdings with tickers for this user
  const holdings = await prisma.holding.findMany({
    where: {
      isActive: true,
      portfolio: { userId },
      ...(portfolioId ? { portfolioId } : {}),
      ticker: { not: null },
      manualPrice: null, // Skip manual overrides
    },
  })

  const tickers = [...new Set(holdings.map(h => h.ticker!).filter(Boolean))]
  if (tickers.length === 0) {
    return NextResponse.json({ data: { updated: 0, prices: {} } })
  }

  const priceMap = await fetchMarketPrices(tickers)

  // Update current prices in DB
  const updates = await Promise.allSettled(
    holdings.map(async h => {
      const price = priceMap.get(h.ticker!.toUpperCase())
      if (!price) return null

      // Save to price history for charting
      await prisma.priceHistory.upsert({
        where: { holdingId_date: { holdingId: h.id, date: new Date(new Date().toDateString()) } },
        create: {
          holdingId: h.id,
          ticker: h.ticker!,
          price: price.price,
          currency: price.currency,
          date: new Date(),
          source: 'yahoo',
        },
        update: { price: price.price },
      }).catch(() => {}) // Non-critical

      return prisma.holding.update({
        where: { id: h.id },
        data: { currentPrice: price.price },
      })
    })
  )

  const updated = updates.filter(r => r.status === 'fulfilled' && r.value).length
  const prices = Object.fromEntries(
    Array.from(priceMap.entries()).map(([ticker, p]) => [ticker, { price: p.price, currency: p.currency, changePct: p.changePct }])
  )

  return NextResponse.json({ data: { updated, prices } })
}

// GET - fetch price for a single ticker (used in UI)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const { fetchMarketPrice } = await import('@/lib/market-data')
  const price = await fetchMarketPrice(ticker)

  return NextResponse.json({ data: price })
}
