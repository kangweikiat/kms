'use server'

import { prisma, PaymentMethodEnum, PaymentStatusEnum } from '@kms/database'
import { revalidatePath } from 'next/cache'
import { getFeePreviewData } from '../students/fee-preview-actions'

export async function generateInstancesForEnrollment(enrollmentId: string) {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                feePackage: true,
                monthlyFeeInstances: true,
                miscFees: true,
            }
        });

        if (!enrollment || !enrollment.feePackage) return { success: false, error: 'Valid enrollment and fee package required.' };

        // We use the existing getFeePreviewData function to calculate the exact line costs for the current state
        const previewRes = await getFeePreviewData(enrollmentId);
        if (!previewRes.success || !previewRes.data) return { success: false, error: 'Could not calculate fee preview.' };

        const { oneTimeFees, monthlyFees } = previewRes.data;

        await prisma.$transaction(async (tx) => {
            // Generate ONE_TIME fees as MiscFees if they don't exist
            for (const item of oneTimeFees) {
                // If final cost is 0 and it's waived, do we create it? Let's create it as PAID to keep a record, or skip?
                // Actually, let's create it with amountDue = finalLineCost. If 0, status is PAID.
                const status = item.finalLineCost <= 0 ? PaymentStatusEnum.PAID : PaymentStatusEnum.UNPAID;

                // Check if already injected (we map feeItemId roughly by name or just assume we don't duplicate names)
                // MiscFee doesn't have a feeItemId column. So we use `name`.
                const exists = enrollment.miscFees.some(m => m.name === item.name);
                if (!exists) {
                    await tx.miscFee.create({
                        data: {
                            enrollmentId,
                            name: item.name,
                            amountDue: item.finalLineCost,
                            status
                        }
                    });
                }
            }

            // Generate MONTHLY fees
            // Assumption: Usually 11 or 12 months in an academic year. We will generate months 1 through 11.
            const TOTAL_MONTHS = 11;

            for (const item of monthlyFees) {
                for (let month = 1; month <= TOTAL_MONTHS; month++) {
                    const status = item.finalLineCost <= 0 ? PaymentStatusEnum.PAID : PaymentStatusEnum.UNPAID;

                    const exists = enrollment.monthlyFeeInstances.some(m => m.feeItemId === item.feeItemId && m.month === month);
                    if (!exists) {
                        await tx.monthlyFeeInstance.create({
                            data: {
                                enrollmentId,
                                feeItemId: item.feeItemId,
                                month,
                                amountDue: item.finalLineCost,
                                status
                            }
                        });
                    }
                }
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Generation Error:', error);
        return { success: false, error: error.message };
    }
}

export async function logPayment(data: {
    enrollmentId: string;
    amountPaid: number;
    method: PaymentMethodEnum;
    note?: string;
    monthlyFeeInstanceId?: string;
    bookInstanceId?: string;
    miscFeeId?: string;
}) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create the payment
            const payment = await tx.payment.create({
                data: {
                    enrollmentId: data.enrollmentId,
                    amountPaid: data.amountPaid,
                    method: data.method,
                    note: data.note,
                    paidAt: new Date(),
                    monthlyFeeInstanceId: data.monthlyFeeInstanceId,
                    bookInstanceId: data.bookInstanceId,
                    miscFeeId: data.miscFeeId
                }
            });

            // 2. Recalculate status of the instance
            if (data.monthlyFeeInstanceId) {
                const instance = await tx.monthlyFeeInstance.findUnique({
                    where: { id: data.monthlyFeeInstanceId },
                    include: { payments: true }
                });
                if (instance) {
                    const totalPaid = instance.payments.reduce((sum, p) => sum + p.amountPaid, 0);
                    const status = totalPaid >= instance.amountDue ? PaymentStatusEnum.PAID :
                        totalPaid > 0 ? PaymentStatusEnum.PARTIAL : PaymentStatusEnum.UNPAID;
                    await tx.monthlyFeeInstance.update({
                        where: { id: instance.id },
                        data: { status }
                    });
                }
            } else if (data.bookInstanceId) {
                const instance = await tx.bookInstance.findUnique({
                    where: { id: data.bookInstanceId },
                    include: { payments: true }
                });
                if (instance) {
                    const totalPaid = instance.payments.reduce((sum, p) => sum + p.amountPaid, 0);
                    const status = totalPaid >= instance.amountDue ? PaymentStatusEnum.PAID :
                        totalPaid > 0 ? PaymentStatusEnum.PARTIAL : PaymentStatusEnum.UNPAID;
                    await tx.bookInstance.update({
                        where: { id: instance.id },
                        data: { status }
                    });
                }
            } else if (data.miscFeeId) {
                const instance = await tx.miscFee.findUnique({
                    where: { id: data.miscFeeId },
                    include: { payments: true }
                });
                if (instance) {
                    const totalPaid = instance.payments.reduce((sum, p) => sum + p.amountPaid, 0);
                    const status = totalPaid >= instance.amountDue ? PaymentStatusEnum.PAID :
                        totalPaid > 0 ? PaymentStatusEnum.PARTIAL : PaymentStatusEnum.UNPAID;
                    await tx.miscFee.update({
                        where: { id: instance.id },
                        data: { status }
                    });
                }
            }
        });

        revalidatePath('/admin/payments');
        return { success: true };
    } catch (error: any) {
        console.error('Payment Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getDashboardData(year: number) {
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { academicYear: year, status: 'ACTIVE' },
            include: {
                student: true,
                feePackage: true,
                monthlyFeeInstances: { include: { payments: true } },
                bookInstances: { include: { payments: true } },
                miscFees: { include: { payments: true } }
            }
        });

        const dashboardRows = enrollments.map(enrol => {
            let totalDue = 0;
            let totalPaid = 0;
            let currentStatus = PaymentStatusEnum.PAID as PaymentStatusEnum;

            const processInstances = (instances: any[]) => {
                instances.forEach(inst => {
                    totalDue += inst.amountDue;
                    const paid = inst.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);
                    totalPaid += paid;

                    if (inst.status === PaymentStatusEnum.UNPAID) currentStatus = PaymentStatusEnum.UNPAID;
                    else if (inst.status === PaymentStatusEnum.PARTIAL && currentStatus === PaymentStatusEnum.PAID) {
                        currentStatus = PaymentStatusEnum.PARTIAL;
                    }
                });
            };

            processInstances(enrol.monthlyFeeInstances);
            processInstances(enrol.bookInstances);
            processInstances(enrol.miscFees);

            // Calculate derived final overall status based purely on derived sums vs currentStatus logic
            let finalStatus: PaymentStatusEnum = currentStatus;

            // If there's an unpaid status but some totalPaid > 0 globally, it's partially paid
            if (finalStatus === PaymentStatusEnum.UNPAID && totalPaid > 0) {
                finalStatus = PaymentStatusEnum.PARTIAL;
            }

            // Only mark PAID if there's actually something due and it was all paid
            if (totalDue > 0 && totalPaid >= totalDue) {
                finalStatus = PaymentStatusEnum.PAID;
            } else if (totalDue > 0 && currentStatus === PaymentStatusEnum.PAID) {
                // If it was kept PAID but totals don't match (shouldn't happen with our logic, but safety check)
                finalStatus = PaymentStatusEnum.PARTIAL;
            } else if (totalDue === 0 && totalPaid === 0 && enrol.feePackageId) {
                // Nothing generated yet perhaps
                finalStatus = PaymentStatusEnum.UNPAID;
            }

            return {
                enrollmentId: enrol.id,
                studentId: enrol.student.id,
                studentName: enrol.student.name,
                level: enrol.enrollmentLevel,
                program: enrol.programType,
                totalDue,
                totalPaid,
                totalOutstanding: Math.max(0, totalDue - totalPaid),
                status: finalStatus
            };
        });

        return { success: true, data: dashboardRows };
    } catch (error: any) {
        console.error('Fetch Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getEnrollmentPaymentDetails(enrollmentId: string) {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                student: true,
                feePackage: true,
                class: true,
                monthlyFeeInstances: {
                    include: {
                        feeItem: true,
                        payments: { orderBy: { createdAt: 'desc' } }
                    },
                    orderBy: { month: 'asc' }
                },
                bookInstances: {
                    include: {
                        feeItem: true,
                        payments: { orderBy: { createdAt: 'desc' } }
                    }
                },
                miscFees: {
                    include: {
                        payments: { orderBy: { createdAt: 'desc' } }
                    }
                }
            }
        });

        if (!enrollment) return { success: false, error: 'Enrollment not found' };

        return { success: true, data: enrollment };
    } catch (error: any) {
        console.error('Fetch Details Error:', error);
        return { success: false, error: error.message };
    }
}
