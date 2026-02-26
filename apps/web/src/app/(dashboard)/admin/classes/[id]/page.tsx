import { prisma } from '@kms/database'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Building, ShieldCheck, Mail, Phone } from 'lucide-react'
import { AssignStudentModal } from './_components/assign-student-modal'
import { RemoveStudentButton } from './_components/remove-student-button'

export default async function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const classData = await prisma.class.findUnique({
        where: { id },
        include: {
            academicYear: true,
            building: true,
            teacher: {
                include: { user: true }
            },
            enrollments: {
                where: { status: 'ACTIVE' },
                include: {
                    student: true
                },
                orderBy: {
                    student: { name: 'asc' }
                }
            }
        }
    })

    if (!classData) {
        notFound()
    }

    // Find students available to assign to this class
    // Rules: ACTIVE enrollment, matching academic year, not assigned to ANY class yet
    // Or maybe they can be reassigned? The requirements didn't specify reassignment directly,
    // but usually you can assign if classId is null. We'll restrict to classId: null for simplicity.
    const unassignedEnrollments = await prisma.enrollment.findMany({
        where: {
            academicYear: classData.academicYear.year,
            enrollmentLevel: classData.level as any, // Cast to any to avoid Prisma strict type checking issues if not completely rebuilt in memory yet
            status: 'ACTIVE',
            classId: null
        },
        include: {
            student: true
        },
        orderBy: {
            student: { name: 'asc' }
        }
    })

    const usedCapacity = classData.enrollments.length
    const isFull = usedCapacity >= classData.capacity

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/classes"
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{classData.name} ({classData.academicYear.year} • {classData.level})</h1>
                    <p className="text-sm text-gray-500">Manage students assigned to this class.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Class Overview</h2>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="text-gray-500 font-medium flex items-center gap-2">
                                    <Building className="w-4 h-4" /> Building
                                </dt>
                                <dd className="mt-1 font-semibold text-gray-900">{classData.building.name}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Teacher
                                </dt>
                                <dd className="mt-1 font-semibold text-gray-900">
                                    {classData.teacher?.user.name ? classData.teacher.user.name : <span className="text-gray-400">Not Assigned</span>}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Level
                                </dt>
                                <dd className="mt-1 font-semibold text-gray-900">{classData.level}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 font-medium flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Capacity
                                </dt>
                                <dd className="mt-1">
                                    <div className="flex items-center justify-between font-semibold">
                                        <span className={isFull ? 'text-red-600' : 'text-gray-900'}>{usedCapacity} / {classData.capacity} Enrolled</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className={`h-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(100, (usedCapacity / classData.capacity) * 100)}%` }}
                                        />
                                    </div>
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-6">
                            <AssignStudentModal
                                classId={classData.id}
                                availableStudents={unassignedEnrollments}
                                isFull={isFull}
                            />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">Enrolled Students</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {usedCapacity} Students
                            </span>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {classData.enrollments.map((enrollment) => (
                                <li key={enrollment.id} className="p-4 hover:bg-gray-50 transition sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                                                {enrollment.student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <Link href={`/admin/students/${enrollment.studentId}`} className="text-sm font-bold text-gray-900 hover:text-blue-600 transition">
                                                    {enrollment.student.name}
                                                </Link>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${enrollment.student.race.toLowerCase() === 'malay' ? 'bg-green-100 text-green-800' :
                                                            enrollment.student.race.toLowerCase() === 'chinese' ? 'bg-yellow-100 text-yellow-800' :
                                                                enrollment.student.race.toLowerCase() === 'indian' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {enrollment.student.race}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 uppercase">
                                                        {enrollment.student.gender}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${enrollment.isNewStudent ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                                                    >
                                                        {enrollment.isNewStudent ? 'New' : 'Old'}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 uppercase">
                                                        {enrollment.programType.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${enrollment.transport ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {enrollment.transport ? 'Transport' : 'No Transport'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <RemoveStudentButton enrollmentId={enrollment.id} classId={classData.id} studentName={enrollment.student.name} />
                                    </div>
                                </li>
                            ))}
                            {classData.enrollments.length === 0 && (
                                <li className="p-8 text-center bg-white">
                                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <h3 className="text-sm font-medium text-gray-900">No students enrolled</h3>
                                    <p className="text-sm text-gray-500 mt-1">Assign students to this class using the sidebar panel.</p>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
