'use server'

import { prisma } from '@kms/database'
import { revalidatePath } from 'next/cache'

export async function createClass(prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const capacityStr = formData.get('capacity') as string
    const level = formData.get('level') as any // EnrollmentLevel
    const buildingId = formData.get('buildingId') as string
    const academicYearId = formData.get('academicYearId') as string
    const teacherId = formData.get('teacherId') as string | null

    if (!name || !capacityStr || !level || !buildingId || !academicYearId) {
        return { error: 'Please fill in all required fields.' }
    }

    const capacity = parseInt(capacityStr, 10)
    if (isNaN(capacity) || capacity <= 0) {
        return { error: 'Capacity must be a positive number.' }
    }

    try {
        await prisma.class.create({
            data: {
                name,
                description,
                capacity,
                level,
                buildingId,
                academicYearId,
                teacherId: teacherId || null
            }
        })
        revalidatePath('/admin/classes')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'A class with this name already exists in the selected academic year.' }
        }
        return { error: 'Failed to create class.' }
    }
}

export async function updateClass(id: string, prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const capacityStr = formData.get('capacity') as string
    const level = formData.get('level') as any // EnrollmentLevel
    const buildingId = formData.get('buildingId') as string
    const academicYearId = formData.get('academicYearId') as string
    const teacherId = formData.get('teacherId') as string | null
    const isActive = formData.get('isActive') === 'true'

    if (!name || !capacityStr || !level || !buildingId || !academicYearId) {
        return { error: 'Please fill in all required fields.' }
    }

    const capacity = parseInt(capacityStr, 10)
    if (isNaN(capacity) || capacity <= 0) {
        return { error: 'Capacity must be a positive number.' }
    }

    try {
        await prisma.class.update({
            where: { id },
            data: {
                name,
                description,
                capacity,
                level,
                buildingId,
                academicYearId,
                teacherId: teacherId || null,
                isActive
            }
        })
        revalidatePath('/admin/classes')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'A class with this name already exists in the selected academic year.' }
        }
        return { error: 'Failed to update class.' }
    }
}

export async function toggleClassStatus(id: string, isActive: boolean) {
    try {
        await prisma.class.update({
            where: { id },
            data: { isActive }
        })
        revalidatePath('/admin/classes')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to update class status.' }
    }
}

export async function deleteClass(id: string) {
    try {
        const classData = await prisma.class.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            }
        })

        if (!classData) {
            return { error: 'Class not found.' }
        }

        if (classData._count.enrollments > 0) {
            return { error: 'Cannot delete class with enrolled students. Deactivate it instead, or remove students first.' }
        }

        await prisma.class.delete({
            where: { id }
        })
        revalidatePath('/admin/classes')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete class.' }
    }
}

export async function assignStudentToClass(classId: string, enrollmentId: string) {
    return assignStudentsToClass(classId, [enrollmentId])
}

export async function assignStudentsToClass(classId: string, enrollmentIds: string[]) {
    try {
        // 1. Get class details including active enrollments count to check capacity
        const classData = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                _count: {
                    select: { enrollments: { where: { status: 'ACTIVE' } } }
                }
            }
        })

        if (!classData) {
            return { error: 'Class not found.' }
        }

        if (classData._count.enrollments + enrollmentIds.length > classData.capacity) {
            return { error: `Cannot assign ${enrollmentIds.length} students. Class only has ${classData.capacity - classData._count.enrollments} spots left.` }
        }

        // 2. Get enrollment details to ensure it matches the academic year and is ACTIVE
        const enrollments = await prisma.enrollment.findMany({
            where: { id: { in: enrollmentIds } }
        })

        if (enrollments.length !== enrollmentIds.length) {
            return { error: 'Some enrollments were not found.' }
        }

        const academicYearRecord = await prisma.academicYear.findUnique({
            where: { id: classData.academicYearId }
        })

        for (const enrollment of enrollments) {
            if (academicYearRecord?.year !== enrollment.academicYear) {
                return { error: 'One or more students enrollment year does not match class year.' }
            }

            if (enrollment.status === 'CANCELLED' || enrollment.status === 'WITHDRAWN') {
                return { error: 'Cannot assign cancelled or withdrawn enrollments to a class.' }
            }
        }

        // 3. Update enrollments
        await prisma.enrollment.updateMany({
            where: { id: { in: enrollmentIds } },
            data: { classId }
        })

        revalidatePath(`/admin/classes/${classId}`)
        return { success: true }
    } catch (error) {
        return { error: 'Failed to assign students to class.' }
    }
}

export async function removeStudentFromClass(classId: string, enrollmentId: string) {
    try {
        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { classId: null }
        })

        revalidatePath(`/admin/classes/${classId}`)
        return { success: true }
    } catch (error) {
        return { error: 'Failed to remove student from class.' }
    }
}
