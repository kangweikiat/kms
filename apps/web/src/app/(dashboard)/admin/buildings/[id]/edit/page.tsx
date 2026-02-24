import { prisma } from '@kms/database'
import { BuildingForm } from '../../_components/building-form'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditBuildingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const building = await prisma.building.findUnique({
        where: { id }
    })

    if (!building) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/buildings"
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Building</h1>
                    <p className="text-sm text-gray-500">Update location details for {building.name}.</p>
                </div>
            </div>

            <BuildingForm initialData={building} />
        </div>
    )
}
