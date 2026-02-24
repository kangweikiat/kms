import { prisma } from '@kms/database'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { BuildingActions } from './_components/building-actions'

export default async function BuildingsPage() {
    const buildings = await prisma.building.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Buildings</h1>
                <Link
                    href="/admin/buildings/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Add Building
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Description</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {buildings.map((building) => (
                            <tr key={building.id} className="bg-white hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {building.name}
                                </td>
                                <td className="px-6 py-4">
                                    {building.description || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${building.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {building.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/buildings/${building.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                            title="Edit Building"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <BuildingActions id={building.id} isActive={building.isActive} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {buildings.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No buildings found. Click "Add Building" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
