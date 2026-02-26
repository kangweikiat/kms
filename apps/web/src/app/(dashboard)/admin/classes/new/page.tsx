import { prisma } from '@kms/database'
import { ClassForm } from '../_components/class-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewClassPage() {
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
                    <h1 className="text-2xl font-bold text-gray-800">Add Class</h1>
                    <p className="text-sm text-gray-500">Create a new class for an academic year.</p>
                </div>
            </div>

            <ClassForm
                buildings={buildings}
                academicYears={academicYears}
                teachers={teachers}
            />
        </div>
    )
}
