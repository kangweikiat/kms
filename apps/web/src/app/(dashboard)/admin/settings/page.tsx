import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'

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
            </div>
        </div>
    )
}
