import { PackageForm } from '../../_components/package-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@kms/database'
import { notFound } from 'next/navigation'

export default async function EditPackagePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const pkg = await prisma.feePackage.findUnique({
        where: { id: params.id },
        include: {
            feePackageItems: {
                orderBy: { sortOrder: 'asc' }
            }
        }
    })

    if (!pkg) {
        notFound()
    }

    const academicYears = await prisma.academicYear.findMany({
        orderBy: { year: 'desc' }
    })

    // Include inactive ones if already used in this package
    const activeFeeItems = await prisma.feeItem.findMany({
        where: { isActive: true }
    })

    // Check if package uses any inactive ones
    const usedItemIds = pkg.feePackageItems.map(i => i.feeItemId)
    const inactiveUsedItems = await prisma.feeItem.findMany({
        where: {
            id: { in: usedItemIds },
            isActive: false
        }
    })

    const feeItems = [...activeFeeItems, ...inactiveUsedItems].sort((a, b) => a.name.localeCompare(b.name))
    // Remove duplicates just in case
    const uniqueFeeItems = Array.from(new Map(feeItems.map(item => [item.id, item])).values())

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/fee-packages"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Fee Package</h1>
                    <p className="text-sm text-gray-500">Update details for {pkg.name}</p>
                </div>
            </div>

            <PackageForm
                academicYears={academicYears}
                feeItems={uniqueFeeItems}
                initialData={pkg}
            />
        </div>
    )
}
