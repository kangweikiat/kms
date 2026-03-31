import { prisma } from "@kms/database"
import { formatCurrency, formatDateTime } from "@/lib/format-utils"
import { Search } from "lucide-react"
import Link from "next/link"
import { DownloadReceiptButton } from "../../../payments/[enrollmentId]/_components/download-receipt-button"
import { ExportReceiptsButton } from "./_components/export-receipts-button"
import { startOfMonth, endOfMonth, parse, format } from "date-fns"

export const metadata = {
    title: "Receipts Register | KMS Admin",
}

export default async function ReceiptsRegisterPage(
    props: {
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    }
) {
    const searchParams = await props.searchParams;
    const search = typeof searchParams.search === 'string' ? searchParams.search : ''
    const monthStr = typeof searchParams.month === 'string' ? searchParams.month : ''

    let dateFilter = {}
    let parsedMonthDate = null
    if (monthStr) {
        parsedMonthDate = parse(monthStr, 'yyyy-MM', new Date())
        dateFilter = {
            paymentDate: {
                gte: startOfMonth(parsedMonthDate),
                lte: endOfMonth(parsedMonthDate)
            }
        }
    }

    // Fetch receipts
    const receipts = await prisma.receipt.findMany({
        where: {
            ...(search ? {
                OR: [
                    { receiptNo: { contains: search, mode: 'insensitive' } },
                    { enrollment: { student: { name: { contains: search, mode: 'insensitive' } } } }
                ]
            } : {}),
            ...dateFilter
        },
        orderBy: {
            paymentDate: 'desc'
        },
        take: monthStr ? undefined : 100, // Remove limit if viewing a specific month
        include: {
            enrollment: {
                include: {
                    student: true
                }
            },
            payments: {
                include: {
                    monthlyFeeInstance: {
                        include: { payments: true }
                    },
                    bookInstance: {
                        include: { feeItem: true, payments: true }
                    },
                    miscFee: {
                        include: { payments: true }
                    }
                }
            }
        }
    })

    // Compute total income if a month is selected
    let totalIncome = 0
    if (monthStr && parsedMonthDate) {
        const agg = await prisma.receipt.aggregate({
            _sum: { amount: true },
            where: dateFilter
        })
        totalIncome = agg._sum.amount || 0
    }

    const receiptDataForExport = receipts.map((r) => ({
        date: formatDateTime(r.paymentDate),
        receiptNo: r.receiptNo,
        studentName: r.enrollment.student.name,
        className: `${r.enrollment.enrollmentLevel} - ${r.enrollment.programType.replace(/_/g, ' ')}`,
        method: r.paymentMethod,
        amount: r.amount,
        amountFormatted: formatCurrency(r.amount)
    }))

    const activeMonthLabel = monthStr && parsedMonthDate ? format(parsedMonthDate, 'MMMM yyyy') : ''

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link href="/admin/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Receipts Register</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Receipts Register</h1>
                    <p className="text-gray-500">View and download recent payment receipts.</p>
                </div>
                {receiptDataForExport.length > 0 && (
                    <ExportReceiptsButton 
                        receipts={receiptDataForExport} 
                        monthLabel={activeMonthLabel} 
                    />
                )}
            </div>

            {/* Filters & Summary */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <form className="flex flex-1 items-center gap-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={search}
                            placeholder="Search receipt no or student..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <input
                        type="month"
                        name="month"
                        defaultValue={monthStr}
                        className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Filter
                    </button>
                    {(search || monthStr) && (
                        <Link href="/admin/reports/payments/receipts" className="text-sm text-gray-500 hover:text-gray-900">
                            Clear
                        </Link>
                    )}
                </form>

                {monthStr && parsedMonthDate && (
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total Income for {format(parsedMonthDate, 'MMMM yyyy')}</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {receipts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No receipts found.
                                    </td>
                                </tr>
                            ) : (
                                receipts.map((receipt) => {
                                    // Adapt receipt struct for the external DownloadReceiptButton component
                                    const formattedReceiptDetails = {
                                        ...receipt,
                                        studentName: receipt.enrollment.student.name,
                                        enrollmentLevel: receipt.enrollment.enrollmentLevel,
                                    }

                                    return (
                                        <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDateTime(receipt.paymentDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {receipt.receiptNo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <Link href={`/admin/payments/${receipt.enrollmentId}`} className="hover:text-blue-600 hover:underline">
                                                    {receipt.enrollment.student.name}
                                                </Link>
                                                <div className="text-xs text-gray-400 mt-0.5">{receipt.enrollment.enrollmentLevel} - {receipt.enrollment.programType.replace(/_/g, ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {receipt.paymentMethod.replace(/_/g, ' ')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                {formatCurrency(receipt.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end pr-2">
                                                    <DownloadReceiptButton 
                                                        receiptNo={receipt.receiptNo} 
                                                        receiptDetails={formattedReceiptDetails} 
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
