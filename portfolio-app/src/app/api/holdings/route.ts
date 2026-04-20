// src/app/api/holdings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const HoldingSchema = z.object({
  portfolioId: z.string().min(1),
  assetName: z.string().min(1).max(200),
  ticker: z.string().max(20).nullable().optional(),
  assetType: z.enum(['STOCK', 'ETF', 'CASH', 'CRYPTO', 'STRUCTURED', 'TIME_DEPOSIT']),
  quantity: z.number().positive(),
  purchasePrice: z.number().positive(),
  currency: z.string().length(3),
  purchaseDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  manualPrice: z.number().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const portfolioId = searchParams.get('portfolioId')

  const userId = (session.user as any).id

  // Verify portfolio ownership
  if (portfolioId) {
    const portfolio = await prisma.portfolio.findFirst({ where: { id: portfolioId, userId } })
    if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const holdings = await prisma.holding.findMany({
    where: {
      isActive: true,
      portfolio: { userId },
      ...(portfolioId ? { portfolioId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: holdings })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const parsed = HoldingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Verify portfolio ownership
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: parsed.data.portfolioId, userId },
  })
  if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })

  // Create holding and initial transaction
  const holding = await prisma.$transaction(async (tx) => {
    const h = await tx.holding.create({
      data: {
        ...parsed.data,
        purchaseDate: new Date(parsed.data.purchaseDate),
        ticker: parsed.data.ticker ?? null,
        manualPrice: parsed.data.manualPrice ?? null,
        notes: parsed.data.notes ?? null,
      },
    })

    await tx.transaction.create({
      data: {
        holdingId: h.id,
        type: 'BUY',
        quantity: parsed.data.quantity,
        price: parsed.data.purchasePrice,
        date: new Date(parsed.data.purchaseDate),
        notes: 'Initial position',
      },
    })

    return h
  })

  // Trigger backfill in background (don't await)
  if (holding.ticker) {
    const { backfillPriceHistory } = await import('@/lib/market-data')
    backfillPriceHistory(holding.ticker, holding.id).catch(console.error)
  }

  return NextResponse.json({ data: holding }, { status: 201 })
}
