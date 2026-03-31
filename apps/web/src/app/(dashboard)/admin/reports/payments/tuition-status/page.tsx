import { prisma } from "@kms/database"
import { formatCurrency } from "@/lib/format-utils"
import Link from "next/link"
import { cookies } from "next/headers"

export const metadata = {
    title: "Tuition Month Status | KMS Admin",
}

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
]

export default async function TuitionStatusPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const cookieStore = await cookies()
    const selectedYear = Number(cookieStore.get('admin_year')?.value) || 2026
    
    // Default to current month if not provided
    const selectedMonth = typeof searchParams.month === 'string'
        ? parseInt(searchParams.month, 10)
        : (new Date().getMonth() + 1);

    // 1) Fetch MonthlyFeeInstance with Prisma optimized includes
    const feeInstances = await prisma.monthlyFeeInstance.findMany({
        where: {
            month: selectedMonth,
            amountDue: { gt: 0 },
            enrollment: {
                academicYear: selectedYear,
                status: 'ACTIVE'
            }
        },
        include: {
            enrollment: {
                include: {
                    student: true
                }
            },
            payments: true
        }
    })

    // 2-4) Calculate outstanding balances and filter > 0
    let totalUnpaidForMonth = 0;
    const results = feeInstances.map(inst => {
        const totalPaid = inst.payments.reduce((acc, p) => acc + p.amountPaid, 0)
        const outstanding = Math.max(0, inst.amountDue - totalPaid)
        return {
            ...inst,
            totalPaid,
            outstanding
        }
    }).filter(inst => {
        if (inst.outstanding > 0) {
            totalUnpaidForMonth += inst.outstanding
            return true
        }
        return false
    })

    // Sort logically for admins: Level -> Name
    results.sort((a, b) => {
        if (a.enrollment.enrollmentLevel !== b.enrollment.enrollmentLevel) {
            return a.enrollment.enrollmentLevel.localeCompare(b.enrollment.enrollmentLevel)
        }
        return a.enrollment.student.name.localeCompare(b.enrollment.student.name)
    })

    const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Link href="/admin/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Tuition Month Status</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tuition Month Status</h1>
                    <p className="text-gray-500">Track unpaid tuition fees for a specific month.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <form className="flex items-center gap-4">
                    <select
                        name="month"
                        defaultValue={selectedMonth}
                        className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Filter
                    </button>

                    <div className="text-sm text-gray-500 px-2 py-1 bg-gray-50 rounded-md border border-gray-100">
                        Academic Year: <strong>{selectedYear}</strong>
                    </div>
                </form>

                <div className="text-right">
                    <p className="text-sm text-gray-500">Total Unpaid for {selectedMonthLabel}</p>
                    <p className="text-xl font-bold text-rose-600">{formatCurrency(totalUnpaidForMonth)}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Level</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider bg-rose-50">Outstanding</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        All active students have fully paid their tuition for {selectedMonthLabel} {selectedYear}!
                                    </td>
                                </tr>
                            ) : (
                                results.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <Link href={`/admin/payments/${row.enrollmentId}`} className="hover:text-blue-600 hover:underline">
                                                {row.enrollment.student.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.enrollment.enrollmentLevel} - {row.enrollment.programType.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {formatCurrency(row.amountDue)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {formatCurrency(row.totalPaid)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-rose-600 text-right bg-rose-50/20">
                                            {formatCurrency(row.outstanding)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Link 
                                                href={`/admin/payments/${row.enrollmentId}`} 
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Collect Payment
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
