// src/app/api/fx-rates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFxRates } from '@/lib/fx-rates'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const base = (searchParams.get('base') ?? 'USD') as any

  const rates = await getFxRates(base)
  return NextResponse.json({ data: rates })
}
