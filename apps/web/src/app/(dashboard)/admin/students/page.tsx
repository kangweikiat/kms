import { prisma } from '@kms/database'
import Link from 'next/link'
import { Plus, Eye, Pencil } from 'lucide-react'
import { ProgramBadge } from './_components/program-badge'
import { DeleteButton } from './_components/delete-button'
import { ReactivateButton } from './_components/reactivate-button'
import { HardDeleteButton } from './_components/hard-delete-button'
import { StatusFilter } from './_components/status-filter'
import { SearchBar } from './_components/search-bar'
import { Prisma } from '@kms/database'

import { cookies } from 'next/headers'

// ... existing imports

export default async function StudentsPage(props: {
    searchParams: Promise<{ view?: string; q?: string; year?: string }>
}) {
    const searchParams = await props.searchParams
    const cookieStore = await cookies()
    const view = searchParams.view || 'active'
    const query = searchParams.q || ''
    const year = Number(searchParams.year) || Number(cookieStore.get('admin_year')?.value) || 2026


    // Filter by active status AND search query AND academic year
    // View 'active': Show students with ACTIVE enrollment in this year
    // View 'inactive': Show students with WITHDRAWN/COMPLETED enrollment in this year OR Globally Inactive (but with record in this year)

    // Base filter: Must be associated with the year (Search optimization)
    const yearFilter = {
        enrollments: {
            some: {
                academicYear: year
            }
        }
    }

    const statusFilter: Prisma.StudentWhereInput = view === 'active'
        ? {
            enrollments: {
                some: {
                    academicYear: year,
                    status: 'ACTIVE'
                }
            }
        }
        : {
            enrollments: {
                some: {
                    academicYear: year,
                    status: { not: 'ACTIVE' }
                }
            }
        }

    const where: Prisma.StudentWhereInput = {
        AND: [
            yearFilter,
            statusFilter,
            query ? {
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                ]
            } : {}
        ]
    }

    const students = await prisma.student.findMany({
        where,
        include: {
            enrollments: {
                where: { academicYear: year },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    })

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Students</h1>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="w-full sm:w-64">
                        <SearchBar />
                    </div>
                    <StatusFilter />
                    <Link
                        href="/admin/students/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        New Student
                    </Link>
                </div>
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
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No students found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => {
                                const activeEnrollment = student.enrollments[0]
                                const isEnrolledActive = activeEnrollment?.status === 'ACTIVE'

                                return (
                                    <tr key={student.id} className={`hover:bg-gray-50 transition ${!isEnrolledActive ? 'bg-gray-50/70' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {student.firstName} {student.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500">{student.icNo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{activeEnrollment?.enrollmentLevel || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {activeEnrollment ? <ProgramBadge type={activeEnrollment.programType} /> : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {activeEnrollment?.status === 'WITHDRAWN' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                                    Withdrawn
                                                </span>
                                            ) : activeEnrollment?.status === 'COMPLETED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                    Completed
                                                </span>
                                            ) : isEnrolledActive ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/students/${student.id}`}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                {isEnrolledActive && (
                                                    <Link
                                                        href={`/admin/students/${student.id}/edit`}
                                                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {isEnrolledActive ? (
                                                    <DeleteButton id={student.id} year={year} />
                                                ) : (
                                                    <>
                                                        <ReactivateButton id={student.id} year={year} />
                                                        {activeEnrollment?.status === 'WITHDRAWN' && (
                                                            <HardDeleteButton id={student.id} year={year} />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
