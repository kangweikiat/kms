import { prisma } from '@kms/database'
import { FeePackagesClient } from './_components/fee-packages-client'

export const dynamic = 'force-dynamic'

export default async function FeePackagesPage() {
    const currentYearNum = new Date().getFullYear()

    // 1. Try to find the exact current calendar year
    let activeYear = await prisma.academicYear.findFirst({
        where: {
            status: 'ACTIVE',
            year: currentYearNum
        },
        include: {
            feePackages: {
                where: { isActive: true },
                include: {
                    feePackageItems: {
                        include: { feeItem: true },
                        orderBy: { sortOrder: 'asc' }
                    },
                    collectionRule: true
                },
                orderBy: [
                    { level: 'asc' },
                    { programType: 'asc' }
                ]
            }
        }
    })

    // 2. If current year isn't active or doesn't exist, fallback to finding an active year that actually has fee packages
    if (!activeYear) {
        activeYear = await prisma.academicYear.findFirst({
            where: {
                status: 'ACTIVE',
                feePackages: {
                    some: { isActive: true }
                }
            },
            include: {
                feePackages: {
                    where: { isActive: true },
                    include: {
                        feePackageItems: {
                            include: { feeItem: true },
                            orderBy: { sortOrder: 'asc' }
                        },
                        collectionRule: true
                    },
                    orderBy: [
                        { level: 'asc' },
                        { programType: 'asc' }
                    ]
                }
            },
            orderBy: { year: 'asc' }
        })
    }

    return <FeePackagesClient activeYear={activeYear} />
}
