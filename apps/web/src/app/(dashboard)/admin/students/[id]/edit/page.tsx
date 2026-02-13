import { prisma } from '@kms/database'
import { StudentForm } from '../../new/_components/student-form'
import { notFound } from 'next/navigation'

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const student = await prisma.student.findUnique({
        where: { id },
    })

    if (!student) {
        return notFound()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
                <p className="text-sm text-gray-500">Update student information below.</p>
            </div>

            <StudentForm student={student} />
        </div>
    )
}
