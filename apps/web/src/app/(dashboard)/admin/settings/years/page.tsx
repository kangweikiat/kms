import { prisma } from '@kms/database'
import { createAcademicYear, deleteAcademicYear, updateAcademicYearStatus } from './actions'
import { Plus } from 'lucide-react'
import { YearActions } from './_components/year-actions'

export default async function AcademicYearsPage() {
    const years = await prisma.academicYear.findMany({
        orderBy: { year: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Academic Years</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Year</h2>
                <form action={createAcademicYear} className="flex gap-4 items-end">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                            Year
                        </label>
                        <input
                            type="number"
                            name="year"
                            id="year"
                            placeholder="e.g. 2027"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Year
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Year</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map((academicYear) => (
                            <tr key={academicYear.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {academicYear.year} Intake
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={academicYear.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <YearActions id={academicYear.id} status={academicYear.status} />
                                </td>
                            </tr>
                        ))}
                        {years.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                    No academic years found. Add one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        ACTIVE: 'bg-green-100 text-green-800',
        COMPLETED: 'bg-blue-100 text-blue-800',
        INACTIVE: 'bg-gray-100 text-gray-800',
    }
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.INACTIVE}`}>
            {status}
        </span>
    )
}
