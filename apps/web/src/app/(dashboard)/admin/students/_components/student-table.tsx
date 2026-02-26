'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Eye, Pencil, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { ProgramBadge } from './program-badge'
import { DeleteButton } from './delete-button'
import { ReactivateButton } from './reactivate-button'
import { HardDeleteButton } from './hard-delete-button'
import { ClassBadge } from '../../classes/_components/class-badge'

// Define the needed types
type BaseStudent = {
    id: string
    name: string
    icNo: string
}

type BaseEnrollment = {
    status: string
    enrollmentLevel: string
    programType: string
    academicYear: number
    class: {
        id: string
        name: string
    } | null
}

type StudentWithEnrollment = BaseStudent & {
    enrollments: BaseEnrollment[]
}

interface StudentTableProps {
    students: (BaseStudent & {
        enrollments: (BaseEnrollment & { class: { id: string, name: string } | null })[]
    })[]
    year: number
    currentPage?: number
    totalPages?: number
    totalItems?: number
}

type SortColumn = 'name' | 'level' | 'program' | 'status' | 'class'
type SortDirection = 'asc' | 'desc' | null

export function StudentTable({ students, year, currentPage = 1, totalPages = 1, totalItems = 0 }: StudentTableProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(null)

    const handleSort = (column: SortColumn) => {
        let newSortDirection: SortDirection = 'asc'
        if (sortColumn === column) {
            if (sortDirection === 'asc') newSortDirection = 'desc'
            else if (sortDirection === 'desc') {
                newSortDirection = null
                setSortColumn(null)
            }
        } else {
            setSortColumn(column)
            newSortDirection = 'asc'
        }
        setSortDirection(newSortDirection)

        const params = new URLSearchParams(searchParams.toString())
        if (newSortDirection) {
            params.set('sortColumn', column)
            params.set('sortDirection', newSortDirection)
        } else {
            params.delete('sortColumn')
            params.delete('sortDirection')
        }
        // Reset page to 1 when sorting
        params.set('page', '1')

        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const sortedStudents = useMemo(() => {
        if (!sortColumn || !sortDirection) return students

        return [...students].sort((a, b) => {
            const enrollA = a.enrollments[0]
            const enrollB = b.enrollments[0]

            let valA: string = ''
            let valB: string = ''

            switch (sortColumn) {
                case 'name':
                    valA = a.name.toLowerCase()
                    valB = b.name.toLowerCase()
                    break
                case 'level':
                    valA = enrollA?.enrollmentLevel || ''
                    valB = enrollB?.enrollmentLevel || ''
                    break
                case 'program':
                    valA = enrollA?.programType || ''
                    valB = enrollB?.programType || ''
                    break
                case 'class':
                    valA = enrollA?.class?.name || ''
                    valB = enrollB?.class?.name || ''
                    break
                case 'status':
                    // Map active to something sortable if needed, or just use string
                    valA = enrollA?.status || 'INACTIVE'
                    valB = enrollB?.status || 'INACTIVE'
                    break
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
    }, [students, sortColumn, sortDirection])

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', newPage.toString())
        router.replace(`${pathname}?${params.toString()}`)
    }

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column || !sortDirection) {
            return <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
        }
        return sortDirection === 'asc' ? (
            <ChevronUp className="w-4 h-4 text-gray-900" />
        ) : (
            <ChevronDown className="w-4 h-4 text-gray-900" />
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th
                                className="px-6 py-4 text-sm font-medium text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-2">
                                    Name
                                    <SortIcon column="name" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-sm font-medium text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                                onClick={() => handleSort('level')}
                            >
                                <div className="flex items-center gap-2">
                                    Level
                                    <SortIcon column="level" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-sm font-medium text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                                onClick={() => handleSort('program')}
                            >
                                <div className="flex items-center gap-2">
                                    Program
                                    <SortIcon column="program" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-sm font-medium text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                                onClick={() => handleSort('class')}
                            >
                                <div className="flex items-center gap-2">
                                    Class
                                    <SortIcon column="class" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-sm font-medium text-gray-500 cursor-pointer group hover:bg-gray-100 transition"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center gap-2">
                                    Status
                                    <SortIcon column="status" />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedStudents.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-white">
                                    No students found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            sortedStudents.map((student) => {
                                const activeEnrollment = student.enrollments[0]
                                const isEnrolledActive = activeEnrollment?.status === 'ACTIVE'

                                return (
                                    <tr key={student.id} className={`hover:bg-gray-50 transition ${!isEnrolledActive ? 'bg-gray-50/70' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {student.name}
                                            </div>
                                            <div className="text-xs text-gray-500">{student.icNo}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{activeEnrollment?.enrollmentLevel || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {// @ts-ignore
                                                activeEnrollment ? <ProgramBadge type={activeEnrollment.programType} /> : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {activeEnrollment?.class ? (
                                                <ClassBadge classData={activeEnrollment.class} />
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 italic">
                                                    Unassigned
                                                </span>
                                            )}
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
                                                        href={`/admin/students/${student.id}/edit${year ? `?year=${year}` : ''}`}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(currentPage * 20, totalItems || 0)}</span> of <span className="font-medium">{totalItems}</span> students
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
