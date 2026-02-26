'use server'

import { prisma } from '@kms/database'
import { revalidatePath } from 'next/cache'

export async function createBuilding(prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null

    if (!name) {
        return { error: 'Building name is required.' }
    }

    try {
        await prisma.building.create({
            data: {
                name,
                description
            }
        })
        revalidatePath('/admin/settings/buildings')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Building name must be unique.' }
        }
        return { error: 'Failed to create building.' }
    }
}

export async function updateBuilding(id: string, prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const isActive = formData.get('isActive') === 'true'

    if (!name) {
        return { error: 'Building name is required.' }
    }

    try {
        await prisma.building.update({
            where: { id },
            data: {
                name,
                description,
                isActive
            }
        })
        revalidatePath('/admin/settings/buildings')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Building name must be unique.' }
        }
        return { error: 'Failed to update building.' }
    }
}

export async function deleteBuilding(id: string) {
    try {
        // Only allow deletion if there are no associated classes
        const building = await prisma.building.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { classes: true }
                }
            }
        })

        if (!building) {
            return { error: 'Building not found.' }
        }

        if (building._count.classes > 0) {
            return { error: 'Cannot delete building with assigned classes. Deactivate it instead.' }
        }

        await prisma.building.delete({
            where: { id }
        })
        revalidatePath('/admin/settings/buildings')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete building.' }
    }
}

export async function toggleBuildingStatus(id: string, isActive: boolean) {
    try {
        await prisma.building.update({
            where: { id },
            data: { isActive }
        })
        revalidatePath('/admin/settings/buildings')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to update building status.' }
    }
}
