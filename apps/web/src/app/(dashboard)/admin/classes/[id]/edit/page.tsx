import { prisma } from '@kms/database'
import { ClassForm } from '../../_components/class-form'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const cls = await prisma.class.findUnique({
        where: { id }
    })

    if (!cls) {
        notFound()
    }

    const buildings = await prisma.building.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    })

    const academicYears = await prisma.academicYear.findMany({
        orderBy: { year: 'desc' }
    })

    const teachers = await prisma.teacherProfile.findMany({
        include: { user: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/classes"
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Class</h1>
                    <p className="text-sm text-gray-500">Update details for {cls.name}.</p>
                </div>
            </div>

            <ClassForm
                initialData={cls}
                buildings={buildings}
                academicYears={academicYears}
                teachers={teachers}
            />
        </div>
    )
}
