// prisma/seed.ts - Creates initial admin user
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.SEED_PASSWORD || 'admin123', 12)

  const user = await prisma.user.upsert({
    where: { email: process.env.SEED_EMAIL || 'admin@family.local' },
    update: {
      password: hashedPassword,
      name: process.env.SEED_NAME || 'Admin',
    },
    create: {
      email: process.env.SEED_EMAIL || 'admin@family.local',
      password: hashedPassword,
      name: process.env.SEED_NAME || 'Admin',
      role: 'admin',
    },
  })

  console.log('✅ Seeded user:', user.email)

  // Create a sample portfolio
  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'sample-portfolio' },
    update: {},
    create: {
      id: 'sample-portfolio',
      name: 'Main Portfolio',
      ownerName: user.name,
      baseCurrency: 'USD',
      description: 'Primary investment portfolio',
      userId: user.id,
    },
  })

  console.log('✅ Seeded portfolio:', portfolio.name)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
