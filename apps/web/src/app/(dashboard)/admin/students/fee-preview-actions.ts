'use server'

import { prisma } from '@kms/database'
import { revalidatePath } from 'next/cache'

export async function getFeePreviewData(enrollmentId: string) {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                feePackage: {
                    include: {
                        feePackageItems: {
                            include: {
                                feeItem: true
                            },
                            orderBy: { sortOrder: 'asc' }
                        },
                        collectionRule: true
                    }
                },
                feeAdjustments: true,
                student: true
            }
        })

        if (!enrollment) return { success: false, error: 'Enrollment not found' }
        if (!enrollment.feePackage) return { success: true, data: null, error: 'No fee package assigned' }

        const pkg = enrollment.feePackage
        const isNewStudent = enrollment.isNewStudent
        const returningStudentWaiverEligible = !isNewStudent

        let totalOneTime = 0
        let totalMonthlyRowTotal = 0
        let upfrontMonths = pkg.collectionRule?.upfrontMonths || 1

        const oneTimeFees: any[] = []
        const monthlyFees: any[] = []

        // Process each fee package item
        pkg.feePackageItems.forEach(item => {
            const isMonthly = item.feeItem.chargeType === 'MONTHLY'
            const defaultAmount = item.unitAmount ?? item.feeItem.defaultAmount

            // Check if there is an explicit database adjustment
            const dbAdjustment = enrollment.feeAdjustments.find(a => a.feeItemId === item.feeItem.id)

            const quantity = dbAdjustment?.quantity ?? item.quantity
            let lineCost = defaultAmount * quantity

            let isAdjusted = false
            let adjustmentAmount = 0
            let adjustmentReason = ''
            let isWaiver = false

            if (dbAdjustment) {
                isAdjusted = true // Even if amount is 0, quantity might be customized
                adjustmentAmount = dbAdjustment.amount
                adjustmentReason = dbAdjustment.reason || 'Custom Adjustment'
                isWaiver = false // It's a manual adjustment
            } else if (item.feeItem.isWaivableForReturningStudents && returningStudentWaiverEligible) {
                // System-level automatic waiver logic for returning students
                isAdjusted = true
                adjustmentAmount = -lineCost // fully waive it
                adjustmentReason = 'Waived for returning student'
                isWaiver = true
            }

            const finalLineCost = Math.max(0, lineCost + adjustmentAmount)

            const feeData = {
                feeItemId: item.feeItem.id,
                name: item.feeItem.name,
                baseCost: lineCost,
                quantity: quantity,
                isAdjusted,
                adjustmentAmount,
                adjustmentReason,
                finalLineCost,
                isWaiver,
                dbAdjustmentId: dbAdjustment?.id || null
            }

            if (isMonthly) {
                monthlyFees.push(feeData)
                totalMonthlyRowTotal += finalLineCost
            } else {
                oneTimeFees.push(feeData)
                totalOneTime += finalLineCost
            }
        })

        const totalMonthlyUpfront = totalMonthlyRowTotal * upfrontMonths
        const totalUpfront = totalOneTime + totalMonthlyUpfront

        return {
            success: true,
            data: {
                oneTimeFees,
                monthlyFees,
                upfrontMonths,
                totalOneTime,
                totalMonthlyUpfront,
                totalUpfront,
                feePackageName: pkg.name
            }
        }

    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function upsertFeeAdjustment(enrollmentId: string, feeItemId: string, amount: number, reason: string, studentId: string, quantity: number | null = null) {
    try {
        await prisma.enrollmentFeeAdjustment.upsert({
            where: {
                enrollmentId_feeItemId: {
                    enrollmentId,
                    feeItemId
                }
            },
            update: {
                amount,
                reason,
                quantity
            },
            create: {
                enrollmentId,
                feeItemId,
                amount,
                reason,
                quantity
            }
        })

        revalidatePath(`/admin/students/${studentId}`)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function removeFeeAdjustment(adjustmentId: string, studentId: string) {
    try {
        await prisma.enrollmentFeeAdjustment.delete({
            where: { id: adjustmentId }
        })

        revalidatePath(`/admin/students/${studentId}`)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
