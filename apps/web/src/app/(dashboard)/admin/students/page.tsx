import { prisma } from '@kms/database'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { StatusFilter } from './_components/status-filter'
import { SearchBar } from './_components/search-bar'
import { Prisma } from '@kms/database'
import { StudentTable } from './_components/student-table'

import { cookies } from 'next/headers'

export default async function StudentsPage(props: {
    searchParams: Promise<{ view?: string; q?: string; year?: string; page?: string }>
}) {
    const searchParams = await props.searchParams
    const cookieStore = await cookies()
    const view = searchParams.view || 'active'
    const query = searchParams.q || ''
    const year = Number(searchParams.year) || Number(cookieStore.get('admin_year')?.value) || 2026

    // Pagination defaults
    const currentPage = Number(searchParams.page) || 1
    const itemsPerPage = 20


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
                name: { contains: query, mode: 'insensitive' }
            } : {}
        ]
    }

    const [students, totalStudents] = await Promise.all([
        prisma.student.findMany({
            where,
            include: {
                enrollments: {
                    where: { academicYear: year },
                    take: 1,
                    include: {
                        class: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage,
        }),
        prisma.student.count({ where })
    ])

    const totalPages = Math.ceil(totalStudents / itemsPerPage)

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

            <StudentTable
                students={students}
                year={year}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalStudents}
            />
        </div>
    )
}
