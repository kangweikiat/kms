import Link from 'next/link'
import { Calendar, ChevronRight, Building } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/admin/settings/years"
                    className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-900">Academic Years</h5>
                    <p className="font-normal text-gray-700">Manage academic years, activate intakes, and archive old records.</p>
                </Link>

                <Link
                    href="/admin/settings/buildings"
                    className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Building className="w-6 h-6 text-indigo-600" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-900">Buildings</h5>
                    <p className="font-normal text-gray-700">Manage school buildings, branches, and facilities.</p>
                </Link>

                <Link
                    href="/admin/settings/fee-items"
                    className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-900">Fee Items</h5>
                    <p className="font-normal text-gray-700">Manage customizable charges used in packages.</p>
                </Link>

                <Link
                    href="/admin/settings/fee-packages"
                    className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-rose-100 rounded-lg">
                            <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <h5 className="mb-2 text-lg font-bold tracking-tight text-gray-900">Fee Packages</h5>
                    <p className="font-normal text-gray-700">Manage billing bundles (Yearly, Half-Yearly) for classes.</p>
                </Link>
            </div>
        </div>
    )
}
