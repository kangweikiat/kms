import { FeeItemForm } from '../../_components/fee-item-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@kms/database'
import { notFound } from 'next/navigation'

export default async function EditFeeItemPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const feeItem = await prisma.feeItem.findUnique({
        where: { id: params.id }
    })

    if (!feeItem) {
        notFound()
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/fee-items"
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Fee Item</h1>
                    <p className="text-sm text-gray-500">Update details for {feeItem.name}</p>
                </div>
            </div>

            <FeeItemForm initialData={feeItem} />
        </div>
    )
}
