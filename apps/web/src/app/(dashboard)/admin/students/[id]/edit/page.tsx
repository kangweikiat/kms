import { prisma } from '@kms/database'
import { StudentForm } from '../../new/_components/student-form'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function EditStudentPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const sp = await searchParams
    const targetYear = sp.year ? Number(sp.year) : undefined

    const cookieStore = await cookies()
    const cookieYear = cookieStore.get('admin_year')?.value
    const currentYear = targetYear || (cookieYear ? Number(cookieYear) : 2026)

    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            enrollments: {
                orderBy: { academicYear: 'desc' }
            }
        }
    })

    // Fetch available years for the dropdown
    const availableYears = await prisma.academicYear.findMany({
        orderBy: { year: 'asc' },
        where: { OR: [{ status: 'ACTIVE' }, { status: 'COMPLETED' }] }
    })

    if (!student) {
        return notFound()
    }

    const activeEnrollment = student.enrollments.find(e => e.academicYear === currentYear && e.status === 'ACTIVE')

    if (!activeEnrollment) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
                </div>
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-sm">Action Restricted</h3>
                        <p className="text-sm mt-1">This student is not actively enrolled in the {currentYear} academic year. You cannot edit their details.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
                <p className="text-sm text-gray-500">Update student information below.</p>
            </div>

            <StudentForm student={student} targetYear={targetYear} availableYears={availableYears} />
        </div>
    )
}
