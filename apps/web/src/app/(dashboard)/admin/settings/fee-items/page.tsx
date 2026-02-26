import { prisma } from '@kms/database'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { FeeItemActions } from './_components/fee-item-actions'

export default async function FeeItemsPage() {
    const feeItems = await prisma.feeItem.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { feePackageItems: true }
            }
        }
    })

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fee Items</h1>
                    <p className="text-sm text-gray-500">Manage individual customizable charges used in fee packages.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/settings/fee-items/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Add Fee Item
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-semibold">Name</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Code</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-right">Default Amount</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-center">Status</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-center">Used In Packages</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {feeItems.map((item) => (
                            <tr key={item.id} className="bg-white hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {item.name}
                                    {item.description && (
                                        <p className="text-xs text-gray-500 font-normal mt-1">{item.description}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {item.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    RM {item.defaultAmount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {item.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {item._count.feePackageItems > 0 ? (
                                        <span className="text-blue-600 font-medium">{item._count.feePackageItems}</span>
                                    ) : (
                                        <span className="text-gray-400">0</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/settings/fee-items/${item.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                            title="Edit Fee Item"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <FeeItemActions id={item.id} canDelete={item._count.feePackageItems === 0} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {feeItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No fee items found. Click "Add Fee Item" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
