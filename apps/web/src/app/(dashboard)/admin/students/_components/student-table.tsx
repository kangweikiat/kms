'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Eye, Pencil, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { ProgramBadge } from './program-badge'
import { DeleteButton } from './delete-button'
import { ReactivateButton } from './reactivate-button'
import { HardDeleteButton } from './hard-delete-button'

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
}

type StudentWithEnrollment = BaseStudent & {
    enrollments: BaseEnrollment[]
}

interface StudentTableProps {
    students: StudentWithEnrollment[]
    year: number
}

type SortColumn = 'name' | 'level' | 'program' | 'status'
type SortDirection = 'asc' | 'desc' | null

export function StudentTable({ students, year }: StudentTableProps) {
    const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(null)

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            if (sortDirection === 'asc') setSortDirection('desc')
            else if (sortDirection === 'desc') {
                setSortDirection(null)
                setSortColumn(null)
            }
        } else {
            setSortColumn(column)
            setSortDirection('asc')
        }
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
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
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
        </div >
    )
}
