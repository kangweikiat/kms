'use server'

import { prisma, AcademicYearStatus } from '@kms/database'
import { revalidatePath } from 'next/cache'

export async function getAcademicYears() {
    return await prisma.academicYear.findMany({
        orderBy: { year: 'asc' }
    })
}

export async function createAcademicYear(formData: FormData) {
    const year = Number(formData.get('year'))

    if (!year || isNaN(year)) {
        throw new Error('Invalid year')
    }

    try {
        await prisma.academicYear.create({
            data: {
                year,
                status: 'INACTIVE'
            }
        })
        revalidatePath('/admin')
        revalidatePath('/admin/settings/years')
    } catch (error) {
        console.error('Failed to create academic year:', error)
    }
}

export async function updateAcademicYearStatus(id: string, status: AcademicYearStatus) {
    try {
        await prisma.$transaction(async (tx) => {
            const academicYear = await tx.academicYear.findUniqueOrThrow({ where: { id } })

            // Safety check: Cannot deactivate current year
            if (academicYear.year === new Date().getFullYear() && status === 'INACTIVE') {
                // Instead of throwing, we return an error object
                throw new Error('Cannot deactivate the current academic year.')
                // Note: The catch block below will handle this throw and return { error: ... }
            }

            await tx.academicYear.update({
                where: { id },
                data: { status }
            })

            // Cascading completion
            if (status === 'COMPLETED') {
                await tx.enrollment.updateMany({
                    where: {
                        academicYear: academicYear.year,
                        status: 'ACTIVE'
                    },
                    data: { status: 'COMPLETED' }
                })
            } else if (status === 'ACTIVE') {
                // Revert completion: Mark all COMPLETED enrollments as ACTIVE
                // This allows correcting a mistake if a year was accidentally marked completed
                await tx.enrollment.updateMany({
                    where: {
                        academicYear: academicYear.year,
                        status: 'COMPLETED'
                    },
                    data: { status: 'ACTIVE' }
                })
            }
        })

        revalidatePath('/admin')
        revalidatePath('/admin/settings/years')
        return { success: true }
    } catch (error: any) {
        // Return structured error
        return { error: error.message || 'Failed to update status' }
    }
}

export async function deleteAcademicYear(id: string) {
    try {
        await prisma.academicYear.delete({
            where: { id }
        })
        revalidatePath('/admin')
        revalidatePath('/admin/settings/years')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to delete academic year:', error)
        return { error: 'Failed to delete academic year' }
    }
}
