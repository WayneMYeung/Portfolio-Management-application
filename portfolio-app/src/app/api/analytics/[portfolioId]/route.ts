// src/app/api/analytics/[portfolioId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getFxRates } from '@/lib/fx-rates'
import { computePortfolioAnalytics } from '@/lib/analytics'

export async function GET(
  req: NextRequest,
  { params }: { params: { portfolioId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: params.portfolioId, userId },
    include: { holdings: { where: { isActive: true } } },
  })

  if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const fxRates = await getFxRates(portfolio.baseCurrency as any)
  const analytics = computePortfolioAnalytics(
    portfolio.holdings as any,
    fxRates.rates,
    portfolio.baseCurrency
  )

  return NextResponse.json({ data: analytics })
}
