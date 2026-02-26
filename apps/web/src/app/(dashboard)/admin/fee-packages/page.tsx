import { prisma, BillingPeriod, EnrollmentLevel } from '@kms/database'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Plus, Pencil } from 'lucide-react'
import { PackageActions } from './_components/package-actions'
import { LevelFilter } from '../classes/_components/level-filter'
import { BillingPeriodFilter } from './_components/billing-period-filter'
import { LevelBadge } from '../students/_components/level-badge'

export default async function FeePackagesPage(props: {
    searchParams: Promise<{ year?: string; level?: string; period?: string }>
}) {
    const searchParams = await props.searchParams
    const cookieStore = await cookies()
    const yearInt = Number(searchParams.year) || Number(cookieStore.get('admin_year')?.value) || 2026
    const levelFilter = searchParams.level as EnrollmentLevel | undefined
    const periodFilter = searchParams.period as BillingPeriod | undefined

    const academicYear = await prisma.academicYear.findUnique({
        where: { year: yearInt }
    })

    const feePackages = academicYear ? await prisma.feePackage.findMany({
        where: {
            academicYearId: academicYear.id,
            ...(levelFilter ? { level: levelFilter } : {}),
            ...(periodFilter ? { billingPeriod: periodFilter } : {})
        },
        include: {
            feePackageItems: {
                include: {
                    feeItem: true
                }
            }
        },
        orderBy: [
            { level: 'asc' },
            { billingPeriod: 'asc' }
        ]
    }) : []

    const formatPeriod = (period: BillingPeriod) => {
        return period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fee Packages</h1>
                    <p className="text-sm text-gray-500">Manage billing configurations for {yearInt} Intake</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <LevelFilter currentLevel={levelFilter} />
                    <BillingPeriodFilter currentPeriod={periodFilter} />
                    <Link
                        href="/admin/fee-packages/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Add Package
                    </Link>
                </div>
            </div>

            {!academicYear && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-3">
                    <p className="text-sm">Please create the academic year {yearInt} in Settings first.</p>
                </div>
            )}

            {academicYear && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold">Package Name</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Level</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Billing Period</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-center">Items</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right">Subtotal</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-center">Status</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {feePackages.map((pkg) => {
                                // Calculate total
                                const total = pkg.feePackageItems.reduce((acc, item) => {
                                    const price = item.unitAmount ?? item.feeItem.defaultAmount
                                    return acc + (price * item.quantity)
                                }, 0)

                                return (
                                    <tr key={pkg.id} className="bg-white hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {pkg.name}
                                            {pkg.description && (
                                                <p className="text-xs text-gray-500 font-normal mt-1">{pkg.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <LevelBadge level={pkg.level} />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {formatPeriod(pkg.billingPeriod)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-6 h-6 rounded-full text-xs font-bold">
                                                {pkg.feePackageItems.length}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            RM {total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {pkg.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/fee-packages/${pkg.id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                                    title="Edit Package"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <PackageActions id={pkg.id} />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {feePackages.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No fee packages found. Click "Add Package" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
