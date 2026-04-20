import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUser() {
  const email = process.env.SEED_EMAIL || 'admin@family.local'
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`User ${email} NOT FOUND`)
    return
  }

  console.log(`User found: ${user.email}`)
  console.log(`Password hash: ${user.password}`)
  
  const passwordsToTest = ['qwertyuiop', 'admin123']
  for (const pw of passwordsToTest) {
    const isMatch = await bcrypt.compare(pw, user.password)
    console.log(`Testing password "${pw}": ${isMatch ? 'MATCH' : 'NO MATCH'}`)
  }
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
