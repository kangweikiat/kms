import { prisma } from '@kms/database'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { ProgramBadge } from '../_components/program-badge'
import { DeleteButton } from '../_components/delete-button'
import { ReactivateButton } from '../_components/reactivate-button'
import { HardDeleteButton } from '../_components/hard-delete-button'

export default async function StudentDetailsPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const sp = await searchParams

    // Determine context year
    const cookieStore = await cookies()
    const cookieYear = cookieStore.get('admin_year')?.value
    const yearParam = sp.year
    const currentYear = yearParam ? Number(yearParam) : (cookieYear ? Number(cookieYear) : 2026)

    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            enrollments: {
                orderBy: { academicYear: 'asc' },
                include: {
                    class: true
                }
            },
            parent: {
                include: {
                    user: true
                }
            }
        }
    })

    if (!student) {
        return notFound()
    }

    const enrollmentForYear = student.enrollments.find(e => e.academicYear === currentYear)
    const isEnrolledActive = enrollmentForYear?.status === 'ACTIVE'

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/students"
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Student ID: {student.id}</span>
                            {!isEnrolledActive && <span className="text-red-500 font-medium">({enrollmentForYear?.status || 'Inactive'})</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEnrolledActive && (
                        <Link
                            href={`/admin/students/${student.id}/edit${currentYear ? `?year=${currentYear}` : ''}`}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit Student
                        </Link>
                    )}
                    {isEnrolledActive ? (
                        <DeleteButton id={student.id} year={currentYear} />
                    ) : (
                        <>
                            <ReactivateButton id={student.id} year={currentYear} />
                            {enrollmentForYear?.status === 'WITHDRAWN' && (
                                <HardDeleteButton id={student.id} year={currentYear} redirectTo="/admin/students" />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex flex-col gap-6">
                {/* 1. Student Information */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">IC / MyKid</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.icNo}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Date of Birth</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">
                                {new Date(student.dob).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Gender</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900 capitalize">{student.gender.toLowerCase()}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Race</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900 capitalize">{student.race.toLowerCase()}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Religion</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.religion || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Nationality</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.nationality || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-6 md:col-span-2">
                            <span className="text-sm text-gray-500 md:col-span-1">Address</span>
                            <span className="col-span-2 md:col-span-5 text-sm font-medium text-gray-900">{student.address || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Enrollment History */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Enrollment History
                        </h2>
                        <Link
                            href={`/admin/students/${student.id}/enroll`}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        >
                            + Enroll New Year
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        {student.enrollments && student.enrollments.length > 0 ? (
                            student.enrollments.map((enrollment: any) => (
                                <div key={enrollment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-900 text-base">{enrollment.academicYear}</div>
                                            <div className="text-sm text-gray-600 mt-0.5">
                                                Level {enrollment.enrollmentLevel}
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            enrollment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {enrollment.status}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Program</span>
                                            <span className="font-medium text-gray-900">{enrollment.programType.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Class</span>
                                            <span className="font-medium text-gray-900">{enrollment.class ? enrollment.class.name : 'Unassigned'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Transport</span>
                                            <span className="font-medium text-gray-900">{enrollment.transport ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>

                                    {enrollment.remarks && (
                                        <div className="text-sm text-gray-500 italic mt-2 bg-white p-2 rounded border border-gray-100">
                                            "{enrollment.remarks}"
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No enrollment records found.</p>
                        )}
                    </div>
                </div>

                {/* 3. Parent / Guardian Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        Parent Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">Father's Details</h3>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-gray-500">Name:</span>
                                <span className="col-span-2 text-sm text-gray-900 font-medium">{student.fatherName || '-'}</span>
                                <span className="text-sm text-gray-500">IC:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.fatherIc || '-'}</span>
                                <span className="text-sm text-gray-500">Occupation:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.fatherOccupation || '-'}</span>
                            </div>
                        </div>
                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">Mother's Details</h3>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-gray-500">Name:</span>
                                <span className="col-span-2 text-sm text-gray-900 font-medium">{student.motherName || '-'}</span>
                                <span className="text-sm text-gray-500">IC:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.motherIc || '-'}</span>
                                <span className="text-sm text-gray-500">Occupation:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.motherOccupation || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 text-red-600 flex items-center gap-2">
                        Emergency Contact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Name</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.emergencyName || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Phone</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.emergencyPhone || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-6 md:col-span-2">
                            <span className="text-sm text-gray-500 md:col-span-1">Address</span>
                            <span className="col-span-2 md:col-span-5 text-sm font-medium text-gray-900">{student.emergencyAddress || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
