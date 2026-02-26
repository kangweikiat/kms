import { BuildingForm } from '../_components/building-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewBuildingPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/settings/buildings"
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">New Building</h1>
                    <p className="text-sm text-gray-500">Add a new physical location.</p>
                </div>
            </div>

            <BuildingForm />
        </div>
    )
}
