import Link from 'next/link'
import { PaymentStatusEnum } from '@kms/database'

type DashboardRow = {
    enrollmentId: string
    studentId: string
    studentName: string
    level: string
    program: string
    startupDue: number
    startupPaid: number
    startupOutstanding: number
    startupStatus: PaymentStatusEnum
    miscDue: number
    miscPaid: number
    miscOutstanding: number
    miscStatus: PaymentStatusEnum
    monthlyDue: number
    monthlyPaid: number
    monthlyStatuses: { month: number; status: PaymentStatusEnum | null }[]
    status: PaymentStatusEnum
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']

export function PaymentTable({
    data,
    totalItems,
    currentPage,
    totalPages,
    year
}: {
    data: DashboardRow[]
    totalItems: number
    currentPage: number
    totalPages: number
    year: number
}) {
    const formatCurrency = (amount: number) => `RM ${amount.toFixed(2)}`

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Student & Program</th>
                            <th className="px-6 py-4">Startup Fees</th>
                            <th className="px-6 py-4">Misc Fees</th>
                            <th className="px-6 py-4 min-w-[200px]">Monthly Progress</th>
                            <th className="px-6 py-4 text-center">Global Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.enrollmentId} className="hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{row.studentName}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Level: {row.level} • {row.program.replace(/_/g, ' ')}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-gray-900 font-medium">{formatCurrency(row.startupDue)}</div>
                                        {row.startupOutstanding > 0 && (
                                            <div className="text-xs text-red-600 font-medium">Due: {formatCurrency(row.startupOutstanding)}</div>
                                        )}
                                        {row.startupPaid > 0 && (
                                            <div className="text-xs text-green-600 font-medium">Paid: {formatCurrency(row.startupPaid)}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-gray-900 font-medium">{formatCurrency(row.miscDue)}</div>
                                        {row.miscOutstanding > 0 && (
                                            <div className="text-xs text-red-600 font-medium">Due: {formatCurrency(row.miscOutstanding)}</div>
                                        )}
                                        {row.miscPaid > 0 && (
                                            <div className="text-xs text-green-600 font-medium">Paid: {formatCurrency(row.miscPaid)}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {row.monthlyStatuses.map((m, idx) => {
                                            const bgColor = m.status === 'PAID' ? 'bg-green-500'
                                                : m.status === 'PARTIAL' ? 'bg-amber-400'
                                                    : m.status === 'UNPAID' ? 'bg-red-500'
                                                        : 'bg-gray-200 border border-gray-300';
                                            return (
                                                <div
                                                    key={idx}
                                                    title={`${MONTH_NAMES[idx]}: ${m.status || 'No Fee'}`}
                                                    className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${bgColor}`}
                                                >
                                                    {m.status ? MONTH_NAMES[idx].charAt(0) : '-'}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {row.monthlyDue > 0 && (
                                        <div className="text-xs text-gray-500 mt-2">
                                            {formatCurrency(row.monthlyPaid)} / {formatCurrency(row.monthlyDue)} Paid
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${row.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                        row.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/admin/payments/${row.enrollmentId}`}
                                        className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                    >
                                        Log Payment
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No payment records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Simple Pagination Footer could be added here */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600 flex justify-between items-center">
                <span>Showing {data.length} of {totalItems} total records</span>
            </div>
        </div>
    )
}
