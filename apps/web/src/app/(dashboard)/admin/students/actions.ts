'use server'

import { prisma, EnrollmentLevel, ProgramType } from '@kms/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function determineProgramType(formData: FormData): ProgramType {
    const category = formData.get('programCategory') as string

    if (category === 'FULL') {
        return ProgramType.FULL_DAY
    }

    const session = formData.get('session') as string
    const stayBack = formData.get('stayBack')

    if (session === 'MORNING') {
        return stayBack ? ProgramType.MORNING_STAY_BACK : ProgramType.HALF_DAY_MORNING
    } else {
        return stayBack ? ProgramType.AFTERNOON_STAY_BACK : ProgramType.HALF_DAY_AFTERNOON
    }
}

function extractStudentData(formData: FormData) {
    return {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        icNo: formData.get('icNo') as string,
        dob: new Date(formData.get('dob') as string),
        gender: formData.get('gender') as string,
        race: formData.get('race') as string,
        address: formData.get('address') as string,

        enrollmentYear: Number(formData.get('enrollmentYear')),
        enrollmentLevel: formData.get('enrollmentLevel') as EnrollmentLevel,
        transport: formData.get('transport') === 'yes',
        programType: determineProgramType(formData),

        fatherName: formData.get('fatherName') as string,
        fatherIc: formData.get('fatherIc') as string,
        motherName: formData.get('motherName') as string,
        motherIc: formData.get('motherIc') as string,

        emergencyName: formData.get('emergencyName') as string,
        emergencyPhone: formData.get('emergencyPhone') as string,
        emergencyAddress: formData.get('emergencyAddress') as string,
    }
}

export async function createStudent(prevState: any, formData: FormData) {
    const data = extractStudentData(formData)

    try {
        await prisma.student.create({
            data
        })

        revalidatePath('/admin/students')
    } catch (error) {
        console.error('Failed to create student:', error)
        return { error: 'Failed to create student. IC Number might be duplicate.' }
    }

    redirect('/admin/students')
}

export async function updateStudent(id: string, prevState: any, formData: FormData) {
    const data = extractStudentData(formData)

    try {
        await prisma.student.update({
            where: { id },
            data
        })

        revalidatePath('/admin/students')
        revalidatePath(`/admin/students/${id}`)
    } catch (error) {
        console.error('Failed to update student:', error)
        return { error: 'Failed to update student. Please try again.' }
    }

    redirect('/admin/students')
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
