'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@kms/database'
import { z } from 'zod'

const CreateStudentSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    gender: z.enum(['Male', 'Female']),
    dob: z.string(), // ISO date string
})

export async function createStudent(formData: FormData) {
    const rawData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        gender: formData.get('gender'),
        dob: formData.get('dob'),
    }

    const validatedData = CreateStudentSchema.safeParse(rawData)

    if (!validatedData.success) {
        return {
            message: 'Invalid data',
            errors: validatedData.error.flatten().fieldErrors,
        }
    }

    try {
        await prisma.student.create({
            data: {
                firstName: validatedData.data.firstName,
                lastName: validatedData.data.lastName,
                gender: validatedData.data.gender,
                dob: new Date(validatedData.data.dob),
            },
        })

        revalidatePath('/admin/students')
        return { success: true }
    } catch (error) {
        return { message: 'Database Error: Failed to Create Student' }
    }
}

export async function deleteStudent(id: string) {
    try {
        await prisma.student.delete({
            where: { id },
        })
        revalidatePath('/admin/students')
        return { success: true }
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Student' }
    }
}
