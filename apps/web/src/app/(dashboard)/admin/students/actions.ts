'use server'

import { prisma, EnrollmentLevel, ProgramType, EnrollmentStatus } from '@kms/database'
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
    let nationality = formData.get('nationality') as string
    if (nationality === 'Others') {
        nationality = formData.get('nationalityOther') as string || 'Others'
    }

    return {
        name: formData.get('name') as string,
        icNo: formData.get('icNo') as string,
        dob: new Date(formData.get('dob') as string),
        gender: formData.get('gender') as string,
        race: formData.get('race') as string,
        religion: formData.get('religion') as string || null,
        nationality: nationality || null,
        address: formData.get('address') as string,

        fatherName: formData.get('fatherName') as string,
        fatherIc: formData.get('fatherIc') as string,
        fatherOccupation: formData.get('fatherOccupation') as string || null,
        motherName: formData.get('motherName') as string,
        motherIc: formData.get('motherIc') as string,
        motherOccupation: formData.get('motherOccupation') as string || null,

        emergencyName: formData.get('emergencyName') as string,
        emergencyPhone: formData.get('emergencyPhone') as string,
        emergencyAddress: formData.get('emergencyAddress') as string,
    }
}

function extractEnrollmentData(formData: FormData) {
    return {
        academicYear: Number(formData.get('enrollmentYear')),
        enrollmentLevel: formData.get('enrollmentLevel') as EnrollmentLevel,
        transport: formData.get('transport') === 'yes',
        programType: determineProgramType(formData),
        remarks: formData.get('remarks') as string,
        status: EnrollmentStatus.ACTIVE,
    }
}

export async function createStudent(prevState: any, formData: FormData) {
    const studentData = extractStudentData(formData)
    const enrollmentData = extractEnrollmentData(formData)

    try {
        await prisma.$transaction(async (tx) => {
            const student = await tx.student.create({
                data: studentData
            })

            await tx.enrollment.create({
                data: {
                    ...enrollmentData,
                    studentId: student.id
                }
            })
        })

        revalidatePath('/admin/students')
    } catch (error) {
        console.error('Failed to create student:', error)
        return { error: 'Failed to create student. IC Number might be duplicate.' }
    }

    redirect('/admin/students')
}

export async function updateStudent(id: string, prevState: any, formData: FormData) {
    // For now, this updates Student info. 
    // TODO: Handle Enrollment updates separately or implicitly update the LATEST enrollment?
    // Current requirement implies creating new enrollment for new year, but editing existing?
    // Let's assume this updates the Student Profile primarily.

    // However, the form might still have enrollment fields if the user expects to edit them.
    // We should probably check if we need to update the *current active* enrollment too.

    const studentData = extractStudentData(formData)
    const enrollmentData = extractEnrollmentData(formData)

    try {
        await prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { id },
                data: studentData
            })

            // Upsert enrollment based on the year provided in the form
            // This ensures we update the CORRECT enrollment year, or create it if missing
            await tx.enrollment.upsert({
                where: {
                    studentId_academicYear: {
                        studentId: id,
                        academicYear: enrollmentData.academicYear
                    }
                },
                update: enrollmentData,
                create: {
                    ...enrollmentData,
                    studentId: id
                }
            })
        })

        revalidatePath('/admin/students')
        revalidatePath(`/admin/students/${id}`)
    } catch (error) {
        console.error('Failed to update student:', error)
        return { error: 'Failed to update student. Please try again.' }
    }

    redirect('/admin/students')
}

export async function deleteStudent(id: string, year: number) {
    try {
        await prisma.enrollment.updateMany({
            where: {
                studentId: id,
                academicYear: year,
                status: 'ACTIVE'
            },
            data: {
                status: 'WITHDRAWN'
            }
        })

        revalidatePath('/admin/students')
        revalidatePath(`/admin/students/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Delete student error:', error)
        return { message: 'Database Error: Failed to withdrawn student' }
    }
}

export async function reactivateStudent(id: string, year: number) {
    try {
        // Restore the enrollment for the specific year to ACTIVE
        await prisma.enrollment.updateMany({
            where: {
                studentId: id,
                academicYear: year,
            },
            data: {
                status: 'ACTIVE'
            }
        })

        revalidatePath('/admin/students')
        revalidatePath(`/admin/students/${id}`)
        return { success: true }
    } catch (error) {
        console.error('Reactivate error:', error)
        return { message: 'Database Error: Failed to Reactivate Student' }
    }
}

export async function hardDeleteStudent(id: string, year: number) {
    try {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                studentId: id,
                academicYear: year,
                status: {
                    in: ['WITHDRAWN', 'CANCELLED']
                }
            }
        });

        if (!enrollment) {
            return { message: 'Enrollment not found or not in a withdrawable state.' };
        }

        // 1. Delete the specific enrollment
        await prisma.enrollment.delete({
            where: {
                id: enrollment.id
            }
        });

        // 2. Check if student has any other enrollments
        const remainingEnrollments = await prisma.enrollment.count({
            where: {
                studentId: id
            }
        });

        // 3. If no other enrollments, delete the student entirely
        if (remainingEnrollments === 0) {
            // We might need to delete related records first if cascade isn't set up, 
            // but Prisma schema usually handles this if relations are optional or cascade delete is configured in DB.
            // Based on schema, relations are optional or simple. 
            // However, fees and attendance might exist. 
            // For a "wrongly enrolled" student, these should likely be empty or we should delete them.
            // Let's safe delete:
            await prisma.fee.deleteMany({ where: { studentId: id } });
            await prisma.attendance.deleteMany({ where: { studentId: id } });
            await prisma.student.delete({
                where: { id }
            });
        }

        revalidatePath('/admin/students')
        return { success: true }
    } catch (error) {
        console.error('Hard delete error:', error);
        return { message: 'Database Error: Failed to permanently delete student record.' }
    }
}

export async function enrollStudent(studentId: string, prevState: any, formData: FormData) {
    const enrollmentData = extractEnrollmentData(formData)

    try {
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_academicYear: {
                    studentId,
                    academicYear: enrollmentData.academicYear
                }
            }
        })

        if (existingEnrollment) {
            return { error: `Student is already enrolled for the ${enrollmentData.academicYear} academic year.` }
        }

        await prisma.enrollment.create({
            data: {
                ...enrollmentData,
                studentId
            }
        })
    } catch (error) {
        console.error('Failed to enroll student:', error)
        // Check for unique constraint violation as a fallback
        if ((error as any).code === 'P2002') {
            return { error: 'Student is already enrolled for this academic year.' }
        }
        return { error: 'Failed to create enrollment. Please try again.' }
    }

    revalidatePath(`/admin/students/${studentId}`)
    redirect(`/admin/students/${studentId}`)
}
