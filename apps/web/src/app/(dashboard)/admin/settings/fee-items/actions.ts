'use server'

import { prisma } from '@kms/database'
import { revalidatePath } from 'next/cache'

export async function createFeeItem(prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const defaultAmountStr = formData.get('defaultAmount') as string
    const description = formData.get('description') as string | null
    const chargeType = formData.get('chargeType') as any

    if (!name || !code || !defaultAmountStr || !chargeType) {
        return { error: 'Please fill in all required fields.' }
    }

    const defaultAmount = parseFloat(defaultAmountStr)
    if (isNaN(defaultAmount) || defaultAmount < 0) {
        return { error: 'Default Amount must be a valid number.' }
    }

    try {
        await prisma.feeItem.create({
            data: {
                name,
                code,
                defaultAmount,
                chargeType,
                description,
                isActive: true
            }
        })
        revalidatePath('/admin/settings/fee-items')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'A Fee Item with this code already exists.' }
        }
        return { error: 'Failed to create fee item.' }
    }
}

export async function updateFeeItem(id: string, prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const defaultAmountStr = formData.get('defaultAmount') as string
    const description = formData.get('description') as string | null
    const chargeType = formData.get('chargeType') as any
    const isActive = formData.get('isActive') === 'true'

    if (!name || !code || !defaultAmountStr || !chargeType) {
        return { error: 'Please fill in all required fields.' }
    }

    const defaultAmount = parseFloat(defaultAmountStr)
    if (isNaN(defaultAmount) || defaultAmount < 0) {
        return { error: 'Default Amount must be a valid number.' }
    }

    try {
        await prisma.feeItem.update({
            where: { id },
            data: {
                name,
                code,
                defaultAmount,
                description,
                isActive
            }
        })
        revalidatePath('/admin/settings/fee-items')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'A Fee Item with this code already exists.' }
        }
        return { error: 'Failed to update fee item.' }
    }
}

export async function deleteFeeItem(id: string) {
    try {
        const item = await prisma.feeItem.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { feePackageItems: true }
                }
            }
        });

        if (!item) {
            return { error: 'Fee Item not found.' }
        }

        if (item._count.feePackageItems > 0) {
            return { error: 'Cannot delete a fee item that is used in packages. Deactivate it instead.' }
        }

        await prisma.feeItem.delete({
            where: { id }
        });
        revalidatePath('/admin/settings/fee-items')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete fee item.' }
    }
}
