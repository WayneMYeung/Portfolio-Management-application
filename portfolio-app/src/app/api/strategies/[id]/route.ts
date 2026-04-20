import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const strategy = await prisma.investmentStrategy.findUnique({
    where: { id: params.id },
    include: { portfolio: true }
  })

  // Verify ownership
  if (!strategy || strategy.portfolio.userId !== (session.user as any).id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    data: {
      ...strategy,
      tree: JSON.parse(strategy.tree),
      portfolio: undefined // remove relation
    }
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, tree } = body

  const existing = await prisma.investmentStrategy.findUnique({
    where: { id: params.id },
    include: { portfolio: true }
  })

  if (!existing || existing.portfolio.userId !== (session.user as any).id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.investmentStrategy.update({
    where: { id: params.id },
    data: {
      name,
      description,
      tree: tree ? JSON.stringify(tree) : undefined
    }
  })

  return NextResponse.json({
    data: {
      ...updated,
      tree: JSON.parse(updated.tree)
    }
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.investmentStrategy.findUnique({
    where: { id: params.id },
    include: { portfolio: true }
  })

  if (!existing || existing.portfolio.userId !== (session.user as any).id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.investmentStrategy.delete({
    where: { id: params.id }
  })

  return new NextResponse(null, { status: 204 })
}
