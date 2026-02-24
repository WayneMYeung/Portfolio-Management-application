// src/app/api/holdings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UpdateHoldingSchema = z.object({
  assetName: z.string().min(1).max(200).optional(),
  ticker: z.string().max(20).nullable().optional(),
  assetType: z.enum(['STOCK', 'ETF', 'CASH', 'CRYPTO', 'STRUCTURED', 'TIME_DEPOSIT']).optional(),
  quantity: z.number().positive().optional(),
  purchasePrice: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  purchaseDate: z.string().optional(),
  currentPrice: z.number().positive().nullable().optional(),
  manualPrice: z.number().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
})

async function getHolding(id: string, userId: string) {
  return prisma.holding.findFirst({
    where: { id, portfolio: { userId } },
  })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const holding = await getHolding(params.id, (session.user as any).id)
  if (!holding) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: holding })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await getHolding(params.id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateHoldingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.holding.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.purchaseDate ? { purchaseDate: new Date(parsed.data.purchaseDate) } : {}),
    },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await getHolding(params.id, userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft delete
  await prisma.holding.update({ where: { id: params.id }, data: { isActive: false } })

  return NextResponse.json({ message: 'Deleted' })
}
