import { prisma } from "@kms/database"
import { formatCurrency } from "@/lib/format-utils"
import Link from "next/link"
import { cookies } from "next/headers"

export const metadata = {
    title: "Receivables & Revenue | KMS Admin",
}

const MONTHS = [
    { value: '', label: 'Full Year (YTD)' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
]

export default async function ReceivablesDashboardPage(
    props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
    // Determine the selected year
    const searchParams = await props.searchParams;
    const cookieStore = await cookies()
    const selectedYear = Number(cookieStore.get('admin_year')?.value) || 2026
    const selectedMonth = typeof searchParams.month === 'string' && searchParams.month ? parseInt(searchParams.month, 10) : null
    const selectedLevel = typeof searchParams.level === 'string' && searchParams.level ? searchParams.level : ''

    // Fetch active enrollments with all fee instances
    const activeEnrollments = await prisma.enrollment.findMany({
        where: {
            academicYear: selectedYear,
            status: 'ACTIVE',
            ...(selectedLevel ? { enrollmentLevel: selectedLevel as any } : {})
        },
        include: {
            student: true,
            monthlyFeeInstances: {
                where: {
                    ...(selectedMonth ? { month: selectedMonth } : {}),
                    amountDue: { gt: 0 } // Ignore totally waived non-billed things if any
                },
                include: {
                    payments: true,
                }
            },
            bookInstances: {
                where: { amountDue: { gt: 0 } },
                include: {
                    payments: true,
                }
            },
            miscFees: {
                where: { amountDue: { gt: 0 } },
                include: {
                    payments: true
                }
            }
        },
        orderBy: {
            enrollmentLevel: 'asc'
        }
    })


    let globalSchoolDue = 0
    let globalSchoolPaid = 0
    let globalStartupDue = 0
    let globalStartupPaid = 0

    // Compute outstanding balances
    const studentData = activeEnrollments.map(enrollment => {
        let schoolDue = 0
        let schoolPaid = 0
        let startupDue = 0
        let startupPaid = 0

        enrollment.monthlyFeeInstances.forEach(instance => {
            const paid = instance.payments.reduce((sum, p) => sum + p.amountPaid, 0)
            schoolDue += instance.amountDue
            schoolPaid += paid
        })

        enrollment.bookInstances.forEach(instance => {
            const paid = instance.payments.reduce((sum, p) => sum + p.amountPaid, 0)
            startupDue += instance.amountDue
            startupPaid += paid
        })

        enrollment.miscFees.forEach(instance => {
            const paid = instance.payments.reduce((sum, p) => sum + p.amountPaid, 0)
            
            if (!instance.isAdhoc) {
                startupDue += instance.amountDue
                startupPaid += paid
            }
        })

        globalSchoolDue += schoolDue
        globalSchoolPaid += schoolPaid
        globalStartupDue += startupDue
        globalStartupPaid += startupPaid

        const schoolOutstanding = Math.max(0, schoolDue - schoolPaid)
        const startupOutstanding = Math.max(0, startupDue - startupPaid)
        const totalOutstanding = schoolOutstanding + startupOutstanding

        return {
            enrollment,
            schoolOutstanding,
            startupOutstanding,
            totalOutstanding
        }
    })

    // Sort by largest outstanding first
    studentData.sort((a, b) => b.totalOutstanding - a.totalOutstanding)

    // Derived global outstandings
    const globalSchoolOutstanding = Math.max(0, globalSchoolDue - globalSchoolPaid)
    const globalStartupOutstanding = Math.max(0, globalStartupDue - globalStartupPaid)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Link href="/admin/reports" className="hover:text-blue-600 transition-colors">Reports</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Receivables & Revenue dashboard</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Receivables & Revenue</h1>
                        <p className="text-gray-500">Track profit collected and outstanding debt for {selectedYear} Year.</p>
                    </div>

                    {/* Filters */}
                    <form className="flex items-center gap-3">
                        <select
                            name="level"
                            defaultValue={selectedLevel}
                            className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Classes</option>
                            <option value="M2">M2</option>
                            <option value="M3">M3</option>
                            <option value="M4">M4</option>
                            <option value="M5">M5</option>
                            <option value="M6">M6</option>
                        </select>
                        <select
                            name="month"
                            defaultValue={selectedMonth?.toString() || ''}
                            className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Filter
                        </button>
                    </form>
                </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">School Fees</h3>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-3xl font-bold text-gray-900">{formatCurrency(globalSchoolPaid)}</span>
                        <span className="text-sm text-green-600 font-medium pb-1">Collected</span>
                    </div>
                    <div className="text-sm text-rose-600 font-medium mt-2">
                        {formatCurrency(globalSchoolOutstanding)} Outstanding
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Startup Packages</h3>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-3xl font-bold text-gray-900">{formatCurrency(globalStartupPaid)}</span>
                        <span className="text-sm text-green-600 font-medium pb-1">Collected</span>
                    </div>
                    <div className="text-sm text-rose-600 font-medium mt-2">
                        {formatCurrency(globalStartupOutstanding)} Outstanding
                    </div>
                </div>
            </div>

            {/* Drilldown Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Student Outstanding Drilldown</h3>
                    <span className="text-sm text-gray-500">Showing {studentData.length} active students</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Level</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">School Fee Owing</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Startup Owing</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider bg-rose-50/50">Total Owing</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No active enrollments found.
                                    </td>
                                </tr>
                            ) : (
                                studentData.map((data) => (
                                    <tr key={data.enrollment.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <Link href={`/admin/payments/${data.enrollment.id}`} className="hover:text-blue-600 hover:underline">
                                                {data.enrollment.student.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {data.enrollment.enrollmentLevel} - {data.enrollment.programType.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {formatCurrency(data.schoolOutstanding)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            {formatCurrency(data.startupOutstanding)}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${data.totalOutstanding > 0 ? 'text-rose-600 bg-rose-50/20' : 'text-gray-900 bg-gray-50/20'}`}>
                                            {formatCurrency(data.totalOutstanding)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Link 
                                                href={`/admin/payments/${data.enrollment.id}`} 
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                {data.totalOutstanding > 0 ? 'Collect' : 'View'}
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
