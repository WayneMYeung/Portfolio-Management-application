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

  // Check custom strategies first
  const activeStrategy = await prisma.investmentStrategy.findFirst({
    where: { portfolioId, isActive: true }
  })

  if (activeStrategy) {
    return NextResponse.json({
      data: {
        ...activeStrategy,
        tree: JSON.parse(activeStrategy.tree)
      }
    })
  }

  // No active strategy
  return NextResponse.json({ data: null })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { portfolioId, strategyId, isPreset } = body

  if (!portfolioId || !strategyId) {
    return NextResponse.json({ error: 'Missing portfolioId or strategyId' }, { status: 400 })
  }

  // Verify portfolio ownership
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId, userId: (session.user as any).id }
  })

  if (!portfolio) {
    return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
  }

  // Transaction: Deactivate all, then activate one
  await prisma.$transaction(async (tx) => {
    // 1. Deactivate all custom strategies for this portfolio
    await tx.investmentStrategy.updateMany({
      where: { portfolioId },
      data: { isActive: false }
    })

    // 2. If it's a preset, we need to clone it into the DB as a custom strategy first to mark it active
    // Alternatively, we can let presets remain stateless and only active strategies are in DB.
    // For simplicity, we'll clone a preset if selected, so all 'active' strategies live in the DB.
    if (isPreset) {
      const presets = getPresets()
      const presetData = presets.find(p => p.id === strategyId)
      
      if (!presetData) throw new Error('Preset not found')

      await tx.investmentStrategy.create({
        data: {
           name: presetData.name,
           description: presetData.description,
           isActive: true,
           portfolioId,
           tree: JSON.stringify(presetData.tree)
        }
      })
    } else {
      // 3. Mark the custom one active
      const customExists = await tx.investmentStrategy.findUnique({
        where: { id: strategyId }
      })

      if (customExists && customExists.portfolioId === portfolioId) {
         await tx.investmentStrategy.update({
           where: { id: strategyId },
           data: { isActive: true }
         })
      }
    }
  })

  return NextResponse.json({ success: true, message: 'Active strategy updated' })
}
