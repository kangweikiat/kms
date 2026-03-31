import Link from "next/link"
import { CreditCard, AlertCircle, CalendarDays } from "lucide-react"

export const metadata = {
    title: "Reports | KMS Admin",
}

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports</h1>
                <p className="text-gray-500 mt-2">View and manage system reports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/admin/reports/payments/receipts"
                    className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col items-start gap-4"
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Receipts Register</h3>
                        <p className="text-sm text-gray-500 mt-1">A centralized view of all payment receipts with filtering and export capabilities.</p>
                    </div>
                </Link>

                <Link
                    href="/admin/reports/payments/outstanding"
                    className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col items-start gap-4"
                >
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Receivables & Revenue</h3>
                        <p className="text-sm text-gray-500 mt-1">A unified dashboard tracking total collected profit versus outstanding debt across School Fees, Startup Packages, and Books.</p>
                    </div>
                </Link>
            </div>
        </div>
    )
}
