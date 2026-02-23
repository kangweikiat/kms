import { prisma } from '@kms/database'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EnrollmentForm } from './_components/enrollment-form'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EnrollStudentPage(props: PageProps) {
    const params = await props.params
    const { id } = params

    const student = await prisma.student.findUnique({
        where: { id }
    })

    const academicYears = await prisma.academicYear.findMany({
        orderBy: { year: 'asc' }
    })

    if (!student) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 text-gray-500 text-sm">
                <Link href="/admin/students" className="hover:text-gray-900 transition">Students</Link>
                <span>/</span>
                <Link href={`/admin/students/${id}`} className="hover:text-gray-900 transition">{student.firstName} {student.lastName}</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">New Enrollment</span>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    href={`/admin/students/${id}`}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Enroll Student</h1>
            </div>

            <EnrollmentForm
                studentId={student.id}
                studentName={`${student.firstName} ${student.lastName}`}
                availableYears={academicYears}
            />
        </div>
    )
}
