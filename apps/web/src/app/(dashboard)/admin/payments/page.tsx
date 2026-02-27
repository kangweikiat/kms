import { getDashboardData } from './actions'
import { PaymentTable } from './_components/payment-table'
import { cookies } from 'next/headers'

export default async function PaymentsDashboardPage(props: {
    searchParams: Promise<{ q?: string; year?: string; status?: string }>
}) {
    const searchParams = await props.searchParams
    const cookieStore = await cookies()
    const query = searchParams.q?.toLowerCase() || ''
    const year = Number(searchParams.year) || Number(cookieStore.get('admin_year')?.value) || 2026
    const statusFilter = searchParams.status || 'all'

    // Fetch the raw aggregated data
    const res = await getDashboardData(year)
    if (!res.success) {
        return <div className="p-8 text-red-500">Failed to load payment data: {res.error}</div>
    }

    let data = res.data || []

    // Apply Client-Side style filtering on the Server Component
    if (query) {
        data = data.filter(d =>
            d.studentName.toLowerCase().includes(query) ||
            d.studentId.toLowerCase().includes(query)
        )
    }

    if (statusFilter !== 'all') {
        data = data.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase())
    }

    // Pagination config (simple 20 per page)
    const itemsPerPage = 20
    const currentPage = 1 // Simplified for now, can add ?page= later

    // Sort so UNPAID is at the top, then PARTIAL, then PAID
    data.sort((a, b) => {
        const order = { 'UNPAID': 0, 'PARTIAL': 1, 'PAID': 2 }
        return order[a.status] - order[b.status]
    })

    const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const totalPages = Math.ceil(data.length / itemsPerPage)

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
                {/* We can add filter components here later */}
            </div>

            <PaymentTable
                data={paginatedData}
                totalItems={data.length}
                currentPage={currentPage}
                totalPages={totalPages}
                year={year}
            />
        </div>
    )
}
