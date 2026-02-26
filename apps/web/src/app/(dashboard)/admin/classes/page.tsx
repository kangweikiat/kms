import { prisma } from '@kms/database'
import Link from 'next/link'
import { Plus, Pencil, Users } from 'lucide-react'
import { cookies } from 'next/headers'
import { BuildingFilter } from './_components/building-filter'
import { ClassBadge } from './_components/class-badge'
import { ClassActions } from './_components/class-actions'

export default async function ClassesPage(props: {
    searchParams: Promise<{ year?: string; building?: string }>
}) {
    const searchParams = await props.searchParams
    const cookieStore = await cookies()
    const yearInt = Number(searchParams.year) || Number(cookieStore.get('admin_year')?.value) || 2026
    const buildingFilterId = searchParams.building

    const academicYear = await prisma.academicYear.findUnique({
        where: { year: yearInt }
    })

    const buildings = await prisma.building.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    })

    const classes = academicYear ? await prisma.class.findMany({
        where: {
            academicYearId: academicYear.id,
            ...(buildingFilterId ? { buildingId: buildingFilterId } : {})
        },
        include: {
            building: true,
            teacher: {
                include: { user: true }
            },
            _count: {
                select: { enrollments: { where: { status: 'ACTIVE' } } }
            }
        },
        orderBy: { name: 'asc' }
    }) : []

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
                    <p className="text-sm text-gray-500">Manage classes for {yearInt} Intake</p>
                </div>
                <div className="flex items-center gap-4">
                    <BuildingFilter buildings={buildings} currentBuilding={buildingFilterId} />
                    <Link
                        href="/admin/classes/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Add Class
                    </Link>
                </div>
            </div>

            {!academicYear && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center gap-3">
                    <p className="text-sm">Please create the academic year {yearInt} in Settings first.</p>
                </div>
            )}

            {academicYear && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Class Name</th>
                                <th scope="col" className="px-6 py-3">Level</th>
                                <th scope="col" className="px-6 py-3">Building</th>
                                <th scope="col" className="px-6 py-3 text-center">Capacity</th>
                                <th scope="col" className="px-6 py-3 text-center">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {classes.map((cls) => {
                                const usedCapacity = cls._count.enrollments
                                const isFull = usedCapacity >= cls.capacity
                                return (
                                    <tr key={cls.id} className="bg-white hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <ClassBadge classData={{ id: cls.id, name: cls.name }} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {cls.level}
                                        </td>
                                        <td className="px-6 py-4">
                                            {cls.building.name}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`font-medium ${isFull ? 'text-red-600' : 'text-gray-900'}`}>{usedCapacity} / {cls.capacity}</span>
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min(100, (usedCapacity / cls.capacity) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {cls.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/classes/${cls.id}`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="View Class"
                                                >
                                                    <Users className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/classes/${cls.id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                                    title="Edit Class"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <ClassActions id={cls.id} isActive={cls.isActive} />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {classes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No classes found for this year. Click "Add Class" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
