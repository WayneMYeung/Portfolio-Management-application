// src/app/api/holdings/[id]/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const TransactionSchema = z.object({
  type: z.enum(['BUY', 'SELL', 'DIVIDEND']),
  quantity: z.number().default(0),
  price: z.number().nonnegative(),
  fees: z.number().nonnegative().default(0),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().max(1000).nullable().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const holding = await prisma.holding.findFirst({
    where: { id: params.id, portfolio: { userId } },
    include: { transactions: { orderBy: { date: 'desc' } } },
  })

  if (!holding) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data: holding.transactions })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const parsed = TransactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const holding = await prisma.holding.findFirst({
    where: { id: params.id, portfolio: { userId } },
  })

  if (!holding) return NextResponse.json({ error: 'Holding not found' }, { status: 404 })

  const transaction = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        ...parsed.data,
        holdingId: params.id,
        date: new Date(parsed.data.date),
      },
    })

    // Update holding quantity and purchasePrice (average cost)
    const allTransactions = await tx.transaction.findMany({
      where: { holdingId: params.id },
    })

    let totalQuantity = 0
    let totalCost = 0

    for (const trans of allTransactions) {
      if (trans.type === 'BUY') {
        totalQuantity += trans.quantity
        totalCost += (trans.quantity * trans.price) + trans.fees
      } else if (trans.type === 'SELL') {
        totalQuantity -= trans.quantity
        // Average cost doesn't change on sell, just quantity
      }
    }

    await tx.holding.update({
      where: { id: params.id },
      data: {
        quantity: totalQuantity,
        purchasePrice: totalQuantity > 0 ? (totalCost / totalQuantity) : holding.purchasePrice,
      },
    })

    return t
  })

  return NextResponse.json({ data: transaction }, { status: 201 })
}
