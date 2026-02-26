'use server'

import { prisma, FeeProgramType } from '@kms/database'
import { revalidatePath } from 'next/cache'

export interface FeePackageItemInput {
    feeItemId: string
    quantity: number
    unitAmount: number | null
}

export async function createFeePackage(
    data: {
        name: string
        level: any
        academicYearId: string
        billingPeriod: any
        description?: string
        isActive: boolean
        collectionRuleUpfrontMonths?: number | null
        collectionRuleDescription?: string | null
    },
    items: FeePackageItemInput[]
) {
    if (!data.name || !data.level || !data.academicYearId || !data.billingPeriod) {
        return { error: 'Please fill in all required package fields.' }
    }

    if (items.length === 0) {
        return { error: 'Package must contain at least one fee item.' }
    }

    try {
        await prisma.feePackage.create({
            data: {
                ...data,
                feePackageItems: {
                    create: items.map((item, index) => ({
                        feeItemId: item.feeItemId,
                        quantity: item.quantity,
                        unitAmount: item.unitAmount,
                        sortOrder: index
                    }))
                },
                ...(data.collectionRuleUpfrontMonths && data.collectionRuleUpfrontMonths > 0
                    ? {
                        collectionRule: {
                            create: {
                                upfrontMonths: data.collectionRuleUpfrontMonths,
                                description: data.collectionRuleDescription,
                                isActive: true
                            }
                        }
                    }
                    : {})
            }
        })
        revalidatePath('/admin/settings/fee-packages')
        return { success: true }
    } catch (error: any) {
        console.error("Error creating fee package:", error)
        if (error.code === 'P2002') {
            return { error: 'A Fee Package for this level, program type, and billing period already exists in the selected academic year.' }
        }
        return { error: 'Failed to create fee package.' }
    }
}

export async function updateFeePackage(
    id: string,
    data: {
        name: string
        level: any
        programType: FeeProgramType
        academicYearId: string
        billingPeriod: any
        description?: string
        isActive: boolean
        collectionRuleUpfrontMonths?: number | null
        collectionRuleDescription?: string | null
    },
    items: FeePackageItemInput[]
) {
    if (!data.name || !data.level || !data.programType || !data.academicYearId || !data.billingPeriod) {
        return { error: 'Please fill in all required package fields.' }
    }

    if (items.length === 0) {
        return { error: 'Package must contain at least one fee item.' }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Delete existing items
            await tx.feePackageItem.deleteMany({
                where: { feePackageId: id }
            })

            // Safely manage collection rule to avoid "Record to delete does not exist"
            if (!data.collectionRuleUpfrontMonths || data.collectionRuleUpfrontMonths <= 0) {
                // Remove any existing rule if toggle is off
                await tx.collectionRule.deleteMany({
                    where: { feePackageId: id }
                })
            }

            const ruleData = data.collectionRuleUpfrontMonths && data.collectionRuleUpfrontMonths > 0
                ? {
                    collectionRule: {
                        upsert: {
                            create: {
                                upfrontMonths: data.collectionRuleUpfrontMonths,
                                description: data.collectionRuleDescription,
                                isActive: true
                            },
                            update: {
                                upfrontMonths: data.collectionRuleUpfrontMonths,
                                description: data.collectionRuleDescription,
                                isActive: true
                            }
                        }
                    }
                }
                : {}

            // Update package and create new items
            await tx.feePackage.update({
                where: { id },
                data: {
                    name: data.name,
                    level: data.level,
                    programType: data.programType,
                    academicYearId: data.academicYearId,
                    billingPeriod: data.billingPeriod,
                    description: data.description,
                    isActive: data.isActive,
                    feePackageItems: {
                        create: items.map((item, index) => ({
                            feeItemId: item.feeItemId,
                            quantity: item.quantity,
                            unitAmount: item.unitAmount,
                            sortOrder: index
                        }))
                    },
                    ...ruleData
                }
            })
        })
        revalidatePath('/admin/settings/fee-packages')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'A Fee Package for this level, program type, and billing period already exists in the selected academic year.' }
        }
        return { error: 'Failed to update fee package.' }
    }
}

export async function deleteFeePackage(id: string) {
    try {
        // Cascade delete will handle FeePackageItem automatically based on schema
        await prisma.feePackage.delete({
            where: { id }
        })
        revalidatePath('/admin/settings/fee-packages')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete fee package.' }
    }
}
