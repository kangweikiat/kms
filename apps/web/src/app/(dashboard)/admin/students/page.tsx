import { prisma } from '@kms/database'
import Link from 'next/link'
import { Plus, Eye, Pencil } from 'lucide-react'

export default async function StudentsPage() {
    const students = await prisma.student.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    })

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                <Link
                    href="/admin/students/new"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Student
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-500">Level</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-500">Program</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                                    <div className="text-xs text-gray-500">{student.icNo}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{student.enrollmentLevel}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {student.programType.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/students/${student.id}`}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/students/${student.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
