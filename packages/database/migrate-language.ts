import { PrismaClient, LanguageClass } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching all enrollments where languageClass is null...')
    const enrollments = await prisma.enrollment.findMany({
        where: {
            languageClass: null
        },
        include: {
            student: true
        }
    })

    console.log(`Found ${enrollments.length} enrollments to migrate.`)

    let updatedCount = 0

    for (const enrollment of enrollments) {
        const race = enrollment.student.race?.toUpperCase()
        let newLanguage: LanguageClass | null = null

        if (race === 'CHINESE') {
            newLanguage = LanguageClass.MANDARIN
        } else if (race === 'MALAY') {
            newLanguage = LanguageClass.JAWI
        } else if (race === 'INDIAN') {
            newLanguage = LanguageClass.TAMIL
        }

        if (newLanguage) {
            await prisma.enrollment.update({
                where: { id: enrollment.id },
                data: { languageClass: newLanguage }
            })
            updatedCount++
        }
    }

    console.log(`Successfully migrated ${updatedCount} enrollments with their default language class based on race.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
