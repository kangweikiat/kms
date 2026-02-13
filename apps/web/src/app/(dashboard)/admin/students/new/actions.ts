'use server'

import { prisma, EnrollmentLevel, ProgramType } from '@kms/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createStudent(prevState: any, formData: FormData) {
    // 1. Determine Program Type
    let programType: ProgramType = ProgramType.FULL_DAY
    const category = formData.get('programCategory') as string

    if (category === 'FULL') {
        programType = ProgramType.FULL_DAY
    } else {
        const session = formData.get('session') as string
        const stayBack = formData.get('stayBack')

        if (session === 'MORNING') {
            programType = stayBack ? ProgramType.MORNING_STAY_BACK : ProgramType.HALF_DAY_MORNING
        } else {
            programType = stayBack ? ProgramType.AFTERNOON_STAY_BACK : ProgramType.HALF_DAY_AFTERNOON
        }
    }

    // 2. Construct Data Object
    const data = {
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
        programType, // Use calculated value

        fatherName: formData.get('fatherName') as string,
        fatherIc: formData.get('fatherIc') as string,
        motherName: formData.get('motherName') as string,
        motherIc: formData.get('motherIc') as string,

        emergencyName: formData.get('emergencyName') as string,
        emergencyPhone: formData.get('emergencyPhone') as string,
        emergencyAddress: formData.get('emergencyAddress') as string,
    }

    try {
        await prisma.student.create({
            data
        })

        revalidatePath('/admin/students')
    } catch (error) {
        console.error('Failed to create student:', error)
        // In a real app, we'd return an error state to the form
        return { error: 'Failed to create student. IC Number might be duplicate.' }
    }

    redirect('/admin/students')
}
