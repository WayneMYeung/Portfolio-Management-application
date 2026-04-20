import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getPresets } from '@/lib/strategy-registry'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const portfolioId = searchParams.get('portfolioId')

  if (!portfolioId) {
    return NextResponse.json({ error: 'Portfolio ID required' }, { status: 400 })
  }

  // Get user's custom strategies
  const customStrategiesRaw = await prisma.investmentStrategy.findMany({
    where: { portfolioId },
    orderBy: { createdAt: 'desc' }
  })

  // Parse JSON trees
  const customStrategies = customStrategiesRaw.map(s => ({
    ...s,
    tree: JSON.parse(s.tree)
  }))

  const presets = getPresets()

  return NextResponse.json({
    data: {
      presets,
      custom: customStrategies
    }
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, portfolioId, tree } = body

  if (!name || !portfolioId || !tree) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify portfolio owner
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId, userId: (session.user as any).id }
  })

  if (!portfolio) {
    return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
  }

  const strategy = await prisma.investmentStrategy.create({
    data: {
      name,
      description,
      portfolioId,
      tree: JSON.stringify(tree)
    }
  })

  return NextResponse.json({
    data: {
      ...strategy,
      tree: JSON.parse(strategy.tree)
    }
  }, { status: 201 })
}
