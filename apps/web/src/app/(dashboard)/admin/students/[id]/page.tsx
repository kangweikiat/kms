import { prisma } from '@kms/database'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            class: true,
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
                        <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
                        <p className="text-sm text-gray-500">Student ID: {student.id}</p>
                    </div>
                </div>
                <Link
                    href={`/admin/students/${student.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition"
                >
                    <Pencil className="w-4 h-4" />
                    Edit Student
                </Link>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Student Information */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        Personal Information
                    </h2>
                    <div className="space-y-3">
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
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.gender}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Race</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.race}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Address</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.address || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Enrollment Details */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        Enrollment Details
                    </h2>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Intake Year</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.enrollmentYear}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Level</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.enrollmentLevel}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Program</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {student.programType.replace(/_/g, ' ')}
                                </span>
                            </span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Transport</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">
                                {student.transport ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Status</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                    Active
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Parent / Guardian Info */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        Parent Information
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700">Father</h3>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-gray-500">Name:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.fatherName || '-'}</span>
                                <span className="text-sm text-gray-500">IC:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.fatherIc || '-'}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700">Mother</h3>
                            <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-gray-500">Name:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.motherName || '-'}</span>
                                <span className="text-sm text-gray-500">IC:</span>
                                <span className="col-span-2 text-sm text-gray-900">{student.motherIc || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Emergency Contact */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                        Emergency Contact
                    </h2>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Name</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.emergencyName || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Phone</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.emergencyPhone || '-'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="text-sm text-gray-500">Address</span>
                            <span className="col-span-2 text-sm font-medium text-gray-900">{student.emergencyAddress || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
