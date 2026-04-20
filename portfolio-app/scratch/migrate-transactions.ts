import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  const holdings = await prisma.holding.findMany({
    include: { transactions: true },
  })

  let count = 0
  for (const h of holdings) {
    if (h.transactions.length === 0) {
      await prisma.transaction.create({
        data: {
          holdingId: h.id,
          type: 'BUY',
          quantity: h.quantity,
          price: h.purchasePrice,
          date: h.purchaseDate,
          notes: 'Initial position (migrated)',
        },
      })
      count++
    }
  }

  console.log(`✅ Migrated ${count} holdings with initial transactions.`)
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
