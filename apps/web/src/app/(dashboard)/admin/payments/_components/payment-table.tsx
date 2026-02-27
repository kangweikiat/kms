import Link from 'next/link'
import { PaymentStatusEnum } from '@kms/database'

type DashboardRow = {
    enrollmentId: string
    studentId: string
    studentName: string
    level: string
    program: string
    totalDue: number
    totalPaid: number
    totalOutstanding: number
    status: PaymentStatusEnum
}

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
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Program</th>
                            <th className="px-6 py-4 text-right">Total Due</th>
                            <th className="px-6 py-4 text-right">Paid</th>
                            <th className="px-6 py-4 text-right">Outstanding</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.enrollmentId} className="hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900">{row.studentName}</div>
                                    <div className="text-xs text-gray-500">ID: {row.studentId} • Level: {row.level}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900 font-medium">{row.program.replace(/_/g, ' ')}</div>
                                </td>
                                <td className="px-6 py-4 text-right text-gray-600">
                                    {formatCurrency(row.totalDue)}
                                </td>
                                <td className="px-6 py-4 text-right text-green-600 font-medium">
                                    {formatCurrency(row.totalPaid)}
                                </td>
                                <td className="px-6 py-4 text-right text-red-600 font-bold">
                                    {formatCurrency(row.totalOutstanding)}
                                </td>
                                <td className="px-6 py-4">
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
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
