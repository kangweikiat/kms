'use server'

import { prisma, EnrollmentLevel, ProgramType, EnrollmentStatus, LanguageClass } from '@kms/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { generateInstancesForEnrollment } from '../payments/actions'

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
        return ProgramType.HALF_DAY_AFTERNOON
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
    const rawStartDate = formData.get('startDate') as string
    const startDate = rawStartDate ? new Date(rawStartDate) : new Date()

    const rawLanguage = formData.get('languageClass') as string
    let languageClass: LanguageClass | null = null

    if (rawLanguage && rawLanguage !== 'DEFAULT') {
        languageClass = rawLanguage as LanguageClass
    } else {
        const race = (formData.get('race') as string)?.toUpperCase()
        if (race === 'CHINESE') languageClass = LanguageClass.MANDARIN
        else if (race === 'MALAY') languageClass = LanguageClass.JAWI
        else if (race === 'INDIAN') languageClass = LanguageClass.TAMIL
    }

    return {
        academicYear: Number(formData.get('enrollmentYear')),
        enrollmentLevel: formData.get('enrollmentLevel') as EnrollmentLevel,
        transport: formData.get('transport') === 'yes',
        programType: determineProgramType(formData),
        remarks: formData.get('remarks') as string,
        status: EnrollmentStatus.ACTIVE,
        startDate,
        languageClass,
    }
}

async function autoAssignFeePackage(enrollmentId: string, enrollmentData: any) {
    const yearOpt = await prisma.academicYear.findUnique({
        where: { year: enrollmentData.academicYear }
    });

    if (!yearOpt) return false;

    let searchType = 'HALF_DAY';
    if (enrollmentData.programType === 'FULL_DAY') searchType = 'FULL_DAY';
    else if (enrollmentData.programType.includes('STAY_BACK')) searchType = 'HALF_DAY_EXTENDED';

    const matchingPackage = await prisma.feePackage.findFirst({
        where: {
            level: enrollmentData.enrollmentLevel,
            academicYearId: yearOpt.id,
            programType: searchType as any,
            isActive: true
        }
    });

    if (matchingPackage) {
        const currentEnrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
        if (currentEnrollment?.feePackageId !== matchingPackage.id) {
            await prisma.enrollment.update({
                where: { id: enrollmentId },
                data: {
                    feePackageId: matchingPackage.id,
                    feePackageAssignedAt: new Date()
                }
            });
        }

        await generateInstancesForEnrollment(enrollmentId);
        return true;
    }

    return false;
}

export async function createStudent(prevState: any, formData: FormData) {
    const fields = Object.fromEntries(formData.entries()) as Record<string, string>
    const studentData = extractStudentData(formData)
    const enrollmentData = extractEnrollmentData(formData)

    try {
        let newEnrollmentId: string | null = null;
        await prisma.$transaction(async (tx) => {
            const student = await tx.student.create({
                data: studentData
            })

            const enrollment = await tx.enrollment.create({
                data: {
                    ...enrollmentData,
                    studentId: student.id
                }
            })
            newEnrollmentId = enrollment.id;
        })

        if (newEnrollmentId) {
            await autoAssignFeePackage(newEnrollmentId, enrollmentData);
        }

        revalidatePath('/admin/students')
    } catch (error) {
        console.error('Failed to create student:', error)
        return {
            error: 'Failed to create student. IC Number might be duplicate.',
            fields
        }
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

    const fields = Object.fromEntries(formData.entries()) as Record<string, string>
    const studentData = extractStudentData(formData)
    const enrollmentData = extractEnrollmentData(formData)

    try {
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_academicYear: {
                    studentId: id,
                    academicYear: enrollmentData.academicYear
                }
            }
        });

        const programChanged = existingEnrollment && existingEnrollment.programType !== enrollmentData.programType;
        const { programType: newProgramType, ...enrollmentUpdateData } = enrollmentData;

        const result = await prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { id },
                data: studentData
            })

            // Upsert enrollment based on the year provided in the form
            // This ensures we update the CORRECT enrollment year, or create it if missing
            return await tx.enrollment.upsert({
                where: {
                    studentId_academicYear: {
                        studentId: id,
                        academicYear: enrollmentData.academicYear
                    }
                },
                update: programChanged ? enrollmentUpdateData : enrollmentData,
                create: {
                    ...enrollmentData,
                    studentId: id
                }
            })
        });

        if (!existingEnrollment) {
            await autoAssignFeePackage(result.id, enrollmentData);
        } else if (programChanged) {
            const { changeProgrammeWorkflow } = await import('./program-actions');

            const yearOpt = await prisma.academicYear.findUnique({
                where: { year: enrollmentData.academicYear }
            });

            let toFeePackageId = undefined;
            if (yearOpt) {
                let searchType = 'HALF_DAY';
                if (newProgramType === 'FULL_DAY') searchType = 'FULL_DAY';
                else if ((newProgramType as string).includes('STAY_BACK')) searchType = 'HALF_DAY_EXTENDED';

                const matchingPackage = await prisma.feePackage.findFirst({
                    where: {
                        level: enrollmentData.enrollmentLevel,
                        academicYearId: yearOpt.id,
                        programType: searchType as any,
                        isActive: true
                    }
                });
                toFeePackageId = matchingPackage?.id;
            }

            await changeProgrammeWorkflow({
                enrollmentId: result.id,
                toProgramType: newProgramType as any,
                effectiveMonth: new Date().getMonth() + 1,
                toFeePackageId: toFeePackageId,
                reason: "Program change via Student Edit",
            });
        }

        revalidatePath('/admin/students')
        revalidatePath(`/admin/students/${id}`)
    } catch (error) {
        console.error('Failed to update student:', error)
        return {
            error: 'Failed to update student. Please try again.',
            fields
        }
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

        // 1. Delete all child relations attached to this specific enrollment first (Cascading manual delete)
        await prisma.$transaction([
            // Payments
            prisma.payment.deleteMany({ where: { enrollmentId: enrollment.id } }),

            // Financial Instances
            prisma.monthlyFeeInstance.deleteMany({ where: { enrollmentId: enrollment.id } }),
            prisma.bookInstance.deleteMany({ where: { enrollmentId: enrollment.id } }),
            prisma.miscFee.deleteMany({ where: { enrollmentId: enrollment.id } }),

            // Meta updates
            prisma.enrollmentProgramChange.deleteMany({ where: { enrollmentId: enrollment.id } }),
            prisma.enrollmentFeeAdjustment.deleteMany({ where: { enrollmentId: enrollment.id } }),

            // 2. Finally delete the specific enrollment
            prisma.enrollment.delete({ where: { id: enrollment.id } })
        ]);

        // 3. Check if student has any other enrollments
        const remainingEnrollments = await prisma.enrollment.count({
            where: {
                studentId: id
            }
        });

        // 4. If no other enrollments exist across ANY year, delete the entire student profile
        if (remainingEnrollments === 0) {
            await prisma.$transaction([
                prisma.fee.deleteMany({ where: { studentId: id } }),
                prisma.attendance.deleteMany({ where: { studentId: id } }),
                prisma.student.delete({
                    where: { id }
                })
            ]);
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

        let newEnrollmentId: string | null = null;
        const enrollment = await prisma.enrollment.create({
            data: {
                ...enrollmentData,
                studentId,
                isNewStudent: false
            }
        })
        newEnrollmentId = enrollment.id;

        if (newEnrollmentId) {
            await autoAssignFeePackage(newEnrollmentId, enrollmentData);
        }
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

export async function assignFeePackage(enrollmentId: string, feePackageId: string, studentId: string) {
    try {
        // First delete any previous fee adjustments since we are assigning a new package
        await prisma.enrollmentFeeAdjustment.deleteMany({
            where: { enrollmentId }
        });

        // Also wipe any old instances linked directly to the enrollment so we can regenerate them fresh
        await prisma.monthlyFeeInstance.deleteMany({ where: { enrollmentId } });
        await prisma.bookInstance.deleteMany({ where: { enrollmentId } });
        await prisma.miscFee.deleteMany({ where: { enrollmentId } });

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
                feePackageId,
                feePackageAssignedAt: new Date(),
            }
        });

        // Autogenerate payment tracking instances once assigned
        await generateInstancesForEnrollment(enrollmentId);

        revalidatePath(`/admin/students/${studentId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to assign fee package:', error)
        return { error: 'Failed to assign fee package. Please try again.' }
    }
}
