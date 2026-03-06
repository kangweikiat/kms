'use server'

import { prisma, ProgramType } from '@kms/database'
import { generateInstancesForEnrollment } from '../payments/actions'
import { revalidatePath } from 'next/cache'

export async function changeProgrammeWorkflow({
    enrollmentId,
    toProgramType,
    effectiveMonth,
    toFeePackageId,
    reason,
    adminUserId
}: {
    enrollmentId: string
    toProgramType: ProgramType
    effectiveMonth: number
    toFeePackageId?: string
    reason?: string
    adminUserId?: string
}) {
    // A) Load enrollment and its current status outside transaction for quick validation
    const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
            monthlyFeeInstances: { include: { payments: true } }
        }
    });

    if (!enrollment) throw new Error("Enrollment not found");

    const fromProgramType = enrollment.programType;
    const fromFeePackageId = enrollment.feePackageId;

    // B) Determine which unpaid future months to delete
    const instancesToDelete = enrollment.monthlyFeeInstances.filter(inst => {
        if (inst.month < effectiveMonth) return false;
        const totalPaid = inst.payments.reduce((sum, p) => sum + p.amountPaid, 0);
        return totalPaid === 0;
    }).map(inst => inst.id);

    // C) Execute the initial switch securely inside a transaction
    const programChange = await prisma.$transaction(async (tx) => {
        // Create Audit Trail Row
        const changeLog = await tx.enrollmentProgramChange.create({
            data: {
                enrollmentId,
                effectiveMonth,
                fromProgramType,
                toProgramType,
                fromFeePackageId,
                toFeePackageId,
                reason,
                createdByUserId: adminUserId
            }
        });

        // Delete unpaid monthly instances from effectiveMonth onwards
        if (instancesToDelete.length > 0) {
            await tx.monthlyFeeInstance.deleteMany({
                where: { id: { in: instancesToDelete } }
            });
        }

        // Update Enrollment base data
        await tx.enrollment.update({
            where: { id: enrollmentId },
            data: {
                programType: toProgramType,
                ...(toFeePackageId ? { feePackageId: toFeePackageId } : {})
            }
        });

        return changeLog;
    });

    // D) Regenerate instances to fill back the remaining months using the new package rules
    // Note: generateInstancesForEnrollment automatically respects `effectiveStartMonth` mapping back to Month 1 if needed, 
    // or properly creating instances if they don't exist yet!
    if (toFeePackageId) {
        await generateInstancesForEnrollment(enrollmentId);
    }

    revalidatePath(`/admin/students/${enrollment.studentId}`);

    return {
        programChangeId: programChange.id,
        monthsDeleted: instancesToDelete.length
    };
}
