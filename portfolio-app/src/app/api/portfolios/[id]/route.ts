// src/app/api/portfolios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  ownerName: z.string().min(1).max(100).optional(),
  baseCurrency: z.string().length(3).optional(),
  description: z.string().max(500).nullable().optional(),
})

async function getPortfolio(id: string, userId: string) {
  return prisma.portfolio.findFirst({
    where: { id, userId },
    include: { holdings: { where: { isActive: true }, orderBy: { createdAt: 'desc' } } },
  })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const portfolio = await getPortfolio(params.id, (session.user as any).id)
  if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: portfolio })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await getPortfolio(params.id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.portfolio.update({
    where: { id: params.id },
    data: parsed.data,
    include: { holdings: { where: { isActive: true } } },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await getPortfolio(params.id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.portfolio.delete({ where: { id: params.id } })

  return NextResponse.json({ message: 'Deleted' })
}
