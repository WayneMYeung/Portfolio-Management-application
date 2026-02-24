// src/app/api/ai-insights/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getFxRates } from '@/lib/fx-rates'
import { computePortfolioAnalytics } from '@/lib/analytics'
import { generateAiInsights } from '@/lib/ai-insights'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { portfolioId } = await req.json()

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId },
    include: { holdings: { where: { isActive: true } } },
  })

  if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check cache (regenerate if older than 1 hour)
  const cached = await prisma.aiInsight.findUnique({ where: { portfolioId } })
  if (cached) {
    const age = Date.now() - new Date(cached.generatedAt).getTime()
    if (age < 60 * 60 * 1000) {
      return NextResponse.json({ data: { content: cached.content, generatedAt: cached.generatedAt, cached: true } })
    }
  }

  const fxRates = await getFxRates(portfolio.baseCurrency as any)
  const analytics = computePortfolioAnalytics(portfolio.holdings as any, fxRates.rates, portfolio.baseCurrency)

  const content = await generateAiInsights(portfolio.name, analytics)

  // Cache result
  await prisma.aiInsight.upsert({
    where: { portfolioId },
    create: { portfolioId, content },
    update: { content, generatedAt: new Date() },
  })

  return NextResponse.json({ data: { content, generatedAt: new Date().toISOString(), cached: false } })
}
