import { PrismaClient, Role } from '@prisma/client'

import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@maria.my'
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123'
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    // Upsert Admin User
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { 
            role: Role.ADMIN,
            passwordHash,
        },
        create: {
            email: adminEmail,
            role: Role.ADMIN,
            name: 'Admin User',
            passwordHash,
        },
    })

    console.log({ admin })
    console.log(`Seeded admin user with email: ${adminEmail}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
