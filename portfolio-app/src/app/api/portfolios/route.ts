// src/app/api/portfolios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  ownerName: z.string().min(1).max(100),
  baseCurrency: z.string().length(3),
  description: z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      holdings: { where: { isActive: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: portfolios })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const parsed = CreatePortfolioSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const portfolio = await prisma.portfolio.create({
    data: { ...parsed.data, userId },
    include: { holdings: true },
  })

  return NextResponse.json({ data: portfolio }, { status: 201 })
}
