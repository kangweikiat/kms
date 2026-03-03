'use server'

import { prisma, PaymentMethodEnum, PaymentStatusEnum } from '@kms/database'
import { revalidatePath } from 'next/cache'

export async function generateInstancesForEnrollment(enrollmentId: string) {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                feePackage: true,
                monthlyFeeInstances: { include: { payments: true } },
                miscFees: { include: { payments: true } },
            }
        });

        if (!enrollment || !enrollment.feePackage) return { success: false, error: 'Valid enrollment and fee package required.' };

        // We use the existing getFeePreviewData function to calculate the exact line costs for the current state
        const { getFeePreviewData } = await import('../students/fee-preview-actions');
        const previewRes = await getFeePreviewData(enrollmentId);
        if (!previewRes.success || !previewRes.data) return { success: false, error: 'Could not calculate fee preview.' };

        const { oneTimeFees, monthlyFees } = previewRes.data;

        await prisma.$transaction(async (tx) => {
            // Sync ONE_TIME fees
            for (const item of oneTimeFees) {
                const existing = enrollment.miscFees.find(m => m.name === item.name);
                if (!existing) {
                    const status = item.finalLineCost <= 0 ? PaymentStatusEnum.PAID : PaymentStatusEnum.UNPAID;
                    await tx.miscFee.create({
                        data: {
                            enrollmentId,
                            name: item.name,
                            amountDue: item.finalLineCost,
                            status
                        }
                    });
                } else {
                    const totalPaid = existing.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);

                    // HISTORICAL LOCK: If any money has been paid towards this one-time item, do NOT overwrite its amountDue or status.
                    if (totalPaid > 0) {
                        continue;
                    }

                    let status: PaymentStatusEnum = PaymentStatusEnum.UNPAID;
                    if (item.finalLineCost <= 0) status = PaymentStatusEnum.PAID;

                    if (existing.amountDue !== item.finalLineCost || existing.status !== status) {
                        await tx.miscFee.update({
                            where: { id: existing.id },
                            data: { amountDue: item.finalLineCost, status }
                        });
                    }
                }
            }

            // Sync MONTHLY fees
            const TOTAL_MONTHS = 11;
            const startMonth = enrollment.startDate ? enrollment.startDate.getMonth() + 1 : 1;
            const effectiveStartMonth = Math.min(startMonth, TOTAL_MONTHS);

            // Delete obsolete generated months (e.g. if start date moved from Jan to June, months 1-5 are obsolete)
            const obsoleteInstanceIds = enrollment.monthlyFeeInstances
                .filter(m => m.month < effectiveStartMonth && m.payments.length === 0)
                .map(m => m.id);

            if (obsoleteInstanceIds.length > 0) {
                await tx.monthlyFeeInstance.deleteMany({
                    where: { id: { in: obsoleteInstanceIds } }
                });
            }

            for (const item of monthlyFees) {
                for (let month = effectiveStartMonth; month <= TOTAL_MONTHS; month++) {
                    const existing = enrollment.monthlyFeeInstances.find(m => m.feeItemId === item.feeItemId && m.month === month);
                    if (!existing) {
                        const status = item.finalLineCost <= 0 ? PaymentStatusEnum.PAID : PaymentStatusEnum.UNPAID;
                        await tx.monthlyFeeInstance.create({
                            data: {
                                enrollmentId,
                                feeItemId: item.feeItemId,
                                month,
                                amountDue: item.finalLineCost,
                                status
                            }
                        });
                    } else {
                        const totalPaid = existing.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);

                        // HISTORICAL LOCK: If any money has been paid towards this month, do NOT overwrite its amountDue or status.
                        // This prevents Programme Switches from corrupting past paid months turning them into "Partial".
                        if (totalPaid > 0) {
                            continue;
                        }

                        let status: PaymentStatusEnum = PaymentStatusEnum.UNPAID;
                        if (item.finalLineCost <= 0) status = PaymentStatusEnum.PAID;

                        if (existing.amountDue !== item.finalLineCost || existing.status !== status) {
                            await tx.monthlyFeeInstance.update({
                                where: { id: existing.id },
                                data: { amountDue: item.finalLineCost, status }
                            });
                        }
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

export async function createAdhocCharge(data: { enrollmentId: string; name: string; amountDue: number }) {
    try {
        if (!data.name || data.amountDue <= 0) {
            throw new Error("Invalid charge details");
        }

        await prisma.miscFee.create({
            data: {
                enrollmentId: data.enrollmentId,
                name: data.name,
                amountDue: data.amountDue,
                status: PaymentStatusEnum.UNPAID,
                isAdhoc: true
            }
        });

        revalidatePath('/admin/payments');
        revalidatePath(`/admin/payments/${data.enrollmentId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Adhoc Charge Error:', error);
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
            let startupDue = 0;
            let startupPaid = 0;
            let startupUnpaidCount = 0;
            let startupPartialCount = 0;

            let miscDue = 0;
            let miscPaid = 0;
            let miscUnpaidCount = 0;
            let miscPartialCount = 0;

            const processInstances = (
                instances: any[],
                isMisc: boolean = false
            ) => {
                instances.forEach(inst => {
                    const instPaid = inst.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);

                    // If it's the miscFees array, check the isAdhoc flag
                    if (isMisc && inst.isAdhoc) {
                        miscDue += inst.amountDue;
                        miscPaid += instPaid;
                        if (inst.status === PaymentStatusEnum.UNPAID) miscUnpaidCount++;
                        else if (inst.status === PaymentStatusEnum.PARTIAL) miscPartialCount++;
                    } else {
                        // Startup fees are bookInstances OR non-adhoc miscFees
                        startupDue += inst.amountDue;
                        startupPaid += instPaid;
                        if (inst.status === PaymentStatusEnum.UNPAID) startupUnpaidCount++;
                        else if (inst.status === PaymentStatusEnum.PARTIAL) startupPartialCount++;
                    }
                });
            };

            processInstances(enrol.bookInstances);
            processInstances(enrol.miscFees, true);

            let startupStatus: PaymentStatusEnum = PaymentStatusEnum.PAID;
            if (startupUnpaidCount > 0 && startupPaid > 0) startupStatus = PaymentStatusEnum.PARTIAL;
            else if (startupUnpaidCount > 0 && startupPaid === 0) startupStatus = PaymentStatusEnum.UNPAID;
            else if (startupPartialCount > 0) startupStatus = PaymentStatusEnum.PARTIAL;
            else if (startupDue === 0 && startupPaid === 0) startupStatus = PaymentStatusEnum.UNPAID;

            let miscStatus: PaymentStatusEnum = PaymentStatusEnum.PAID;
            if (miscUnpaidCount > 0 && miscPaid > 0) miscStatus = PaymentStatusEnum.PARTIAL;
            else if (miscUnpaidCount > 0 && miscPaid === 0) miscStatus = PaymentStatusEnum.UNPAID;
            else if (miscPartialCount > 0) miscStatus = PaymentStatusEnum.PARTIAL;
            else if (miscDue === 0 && miscPaid === 0) miscStatus = PaymentStatusEnum.UNPAID;

            // Monthly Fees processing (months 1 to 11 typically)
            // We'll create a simple map of month -> status
            const monthlyGrid: Record<number, PaymentStatusEnum> = {};
            let monthlyDue = 0;
            let monthlyPaid = 0;

            enrol.monthlyFeeInstances.forEach(inst => {
                monthlyDue += inst.amountDue;
                monthlyPaid += inst.payments.reduce((sum: number, p: any) => sum + p.amountPaid, 0);

                // If it's the same month but multiple items, get the "worst" status
                const existing = monthlyGrid[inst.month];
                if (!existing) {
                    monthlyGrid[inst.month] = inst.status;
                } else {
                    if (inst.status === PaymentStatusEnum.UNPAID) monthlyGrid[inst.month] = PaymentStatusEnum.UNPAID;
                    else if (inst.status === PaymentStatusEnum.PARTIAL && existing === PaymentStatusEnum.PAID) {
                        monthlyGrid[inst.month] = PaymentStatusEnum.PARTIAL;
                    }
                }
            });

            // Flatten grid into an array of strictly 11 months for UI consistency, or just up to the max month generated
            const monthlyStatuses = Array.from({ length: 11 }, (_, i) => {
                return { month: i + 1, status: monthlyGrid[i + 1] || null }; // null means no fee for that month
            });

            // Overall Status for filtering/sorting
            let overallStatus: PaymentStatusEnum = PaymentStatusEnum.PAID;
            const totalDue = startupDue + miscDue + monthlyDue;
            const totalPaid = startupPaid + miscPaid + monthlyPaid;
            if (totalDue > 0 && totalPaid === 0) overallStatus = PaymentStatusEnum.UNPAID;
            else if (totalDue > 0 && totalPaid < totalDue) overallStatus = PaymentStatusEnum.PARTIAL;

            return {
                enrollmentId: enrol.id,
                studentId: enrol.student.id,
                studentName: enrol.student.name,
                level: enrol.enrollmentLevel,
                program: enrol.programType,
                startupDue,
                startupPaid,
                startupOutstanding: Math.max(0, startupDue - startupPaid),
                startupStatus,
                miscDue,
                miscPaid,
                miscOutstanding: Math.max(0, miscDue - miscPaid),
                miscStatus,
                monthlyDue,
                monthlyPaid,
                monthlyStatuses,
                status: overallStatus
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

export async function logLumpsumPayment(data: {
    enrollmentId: string;
    amountPaid: number;
    method: PaymentMethodEnum;
    note?: string;
}) {
    try {
        if (data.amountPaid <= 0) {
            throw new Error("Amount must be greater than zero");
        }

        // 1. Fetch data OUTSIDE the transaction to prevent long-running transaction timeouts
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: data.enrollmentId },
            include: {
                monthlyFeeInstances: {
                    include: { payments: true },
                    orderBy: { month: 'asc' }
                },
                bookInstances: {
                    include: { payments: true }
                },
                miscFees: {
                    where: { isAdhoc: false },
                    include: { payments: true }
                }
            }
        });

        if (!enrollment) throw new Error("Enrollment not found");

        // Build a list of items to pay off
        const payableItems: Array<{
            id: string;
            type: 'MONTHLY' | 'BOOK' | 'MISC';
            name: string;
            outstanding: number;
            priority: number;
        }> = [];

        // 2. First month's fees only
        if (enrollment.monthlyFeeInstances.length > 0) {
            const firstMonth = enrollment.monthlyFeeInstances[0].month;
            const firstMonthInstances = enrollment.monthlyFeeInstances.filter(m => m.month === firstMonth);

            for (const inst of firstMonthInstances) {
                const paid = inst.payments.reduce((s, p) => s + p.amountPaid, 0);
                const outstanding = Math.max(0, inst.amountDue - paid);
                if (outstanding > 0) {
                    payableItems.push({
                        id: inst.id,
                        type: 'MONTHLY',
                        name: `Month ${inst.month}`,
                        outstanding,
                        priority: 1
                    });
                }
            }
        }

        // 3. Other fees
        for (const misc of enrollment.miscFees) {
            const paid = misc.payments.reduce((s, p) => s + p.amountPaid, 0);
            const outstanding = Math.max(0, misc.amountDue - paid);
            if (outstanding > 0) {
                let priority = 4;
                const lowerName = misc.name.toLowerCase();
                if (lowerName.includes('deposit')) priority = 2;
                else if (lowerName.includes('registration')) priority = 3;

                payableItems.push({
                    id: misc.id,
                    type: 'MISC',
                    name: misc.name,
                    outstanding,
                    priority
                });
            }
        }

        // Sort by priority (1 to 4)
        payableItems.sort((a, b) => a.priority - b.priority);

        let remainingAmount = data.amountPaid;

        // 4. Perform the updates inside a transaction
        await prisma.$transaction(async (tx) => {
            const operations = [];

            for (const item of payableItems) {
                if (remainingAmount <= 0) break;

                const amountToApply = Math.min(item.outstanding, remainingAmount);
                remainingAmount -= amountToApply;

                // Create payment
                operations.push(
                    tx.payment.create({
                        data: {
                            enrollmentId: data.enrollmentId,
                            amountPaid: amountToApply,
                            method: data.method,
                            note: data.note ? `Lumpsum: ${data.note}` : `Lumpsum Payment Distribution`,
                            paidAt: new Date(),
                            monthlyFeeInstanceId: item.type === 'MONTHLY' ? item.id : null,
                            miscFeeId: item.type === 'MISC' ? item.id : null,
                        }
                    })
                );

                // Update status of the respective item
                const newOutstanding = item.outstanding - amountToApply;
                const newStatus = newOutstanding <= 0 ? PaymentStatusEnum.PAID : PaymentStatusEnum.PARTIAL;

                if (item.type === 'MONTHLY') {
                    operations.push(
                        tx.monthlyFeeInstance.update({
                            where: { id: item.id },
                            data: { status: newStatus }
                        })
                    );
                } else if (item.type === 'MISC') {
                    operations.push(
                        tx.miscFee.update({
                            where: { id: item.id },
                            data: { status: newStatus }
                        })
                    );
                }
            }

            await Promise.all(operations);
        });

        // We do not throw error if remainingAmount > 0 for now (it floats or is just overpaid), 
        // but for safety we just process what we can. 

        revalidatePath('/admin/payments');
        revalidatePath(`/admin/payments/${data.enrollmentId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Lumpsum Payment Error:', error);
        return { success: false, error: error.message };
    }
}
