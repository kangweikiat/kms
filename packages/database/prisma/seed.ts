import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'admin@maria.my'

    // Upsert Admin User
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: Role.ADMIN },
        create: {
            email: adminEmail,
            role: Role.ADMIN,
            name: 'Admin User',
        },
    })

    console.log({ admin })
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
