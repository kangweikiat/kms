import { FeeItemForm } from '../_components/fee-item-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewFeeItemPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/settings/fee-items"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Add Fee Item</h1>
                    <p className="text-sm text-gray-500">Create a new customizable charge.</p>
                </div>
            </div>

            <FeeItemForm />
        </div>
    )
}
