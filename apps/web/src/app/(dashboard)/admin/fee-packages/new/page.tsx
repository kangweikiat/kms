import { PackageForm } from '../_components/package-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@kms/database'

export default async function NewPackagePage() {
    const academicYears = await prisma.academicYear.findMany({
        where: {
            OR: [
                { status: 'ACTIVE' },
                { status: 'INACTIVE' } // Future years might be inactive initially but need setup
            ]
        },
        orderBy: { year: 'desc' }
    })

    const feeItems = await prisma.feeItem.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    })

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
                    <h1 className="text-2xl font-bold text-gray-800">Add Fee Package</h1>
                    <p className="text-sm text-gray-500">Create a new pricing template</p>
                </div>
            </div>

            <PackageForm
                academicYears={academicYears}
                feeItems={feeItems}
            />
        </div>
    )
}
