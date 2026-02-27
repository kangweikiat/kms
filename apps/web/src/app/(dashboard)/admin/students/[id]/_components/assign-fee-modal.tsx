'use client'

import { useState, useTransition } from 'react'
import { assignFeePackage } from '../../actions'
import { Loader2, Calculator } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface FeePackageItem {
    id: string
    unitAmount: number | null
    quantity: number
    feeItem: {
        id: string
        name: string
        code: string
        defaultAmount: number
        chargeType: 'ONE_TIME' | 'MONTHLY'
        isWaivableForReturningStudents: boolean
    }
}

interface FeePackage {
    id: string
    name: string
    level: string
    programType: string
    academicYearId: string
    billingPeriod: string
    feePackageItems: FeePackageItem[]
    collectionRule: {
        upfrontMonths: number
    } | null
}

interface AssignFeeModalProps {
    enrollmentId: string
    studentId: string
    isNewStudent: boolean
    availablePackages: FeePackage[]
}

export function AssignFeeModal({ enrollmentId, studentId, isNewStudent, availablePackages }: AssignFeeModalProps) {
    const [open, setOpen] = useState(false)
    const [selectedPackageId, setSelectedPackageId] = useState<string>('')
    const [isPending, startTransition] = useTransition()

    const selectedPackage = availablePackages.find(p => p.id === selectedPackageId)

    const calculatePreview = () => {
        if (!selectedPackage) return null

        let oneTimeTotal = 0
        let monthlyTotal = 0
        let waivedTotal = 0
        const upfrontMonths = selectedPackage.collectionRule?.upfrontMonths || 1

        selectedPackage.feePackageItems.forEach(item => {
            const amount = item.unitAmount ?? item.feeItem.defaultAmount
            const lineTotal = amount * item.quantity

            if (item.feeItem.chargeType === 'ONE_TIME') {
                if (!isNewStudent && item.feeItem.isWaivableForReturningStudents) {
                    waivedTotal += lineTotal
                } else {
                    oneTimeTotal += lineTotal
                }
            } else if (item.feeItem.chargeType === 'MONTHLY') {
                monthlyTotal += lineTotal
            }
        })

        const upfrontMonthlyTotal = monthlyTotal * upfrontMonths
        const finalUpfrontTotal = oneTimeTotal + upfrontMonthlyTotal

        return {
            oneTimeTotal,
            monthlyTotal,
            upfrontMonths,
            upfrontMonthlyTotal,
            waivedTotal,
            finalUpfrontTotal
        }
    }

    const preview = calculatePreview()

    const handleAssign = () => {
        if (!selectedPackageId) return

        startTransition(async () => {
            await assignFeePackage(enrollmentId, selectedPackageId, studentId)
            setOpen(false)
        })
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition">
                    <Calculator className="w-4 h-4" />
                    Assign Fee Package
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                            Assign Fee Package
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-gray-500 mt-1">
                            Select a fee package for this enrollment.
                        </Dialog.Description>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Available Packages</label>
                            <select
                                value={selectedPackageId}
                                onChange={(e) => setSelectedPackageId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Select a package...</option>
                                {availablePackages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name} ({pkg.billingPeriod.replace(/_/g, ' ')})
                                    </option>
                                ))}
                            </select>
                            {availablePackages.length === 0 && (
                                <p className="text-sm text-red-500 mt-1">No fee packages available for this Enrollment's Level and Program.</p>
                            )}
                        </div>

                        {preview && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                                <h4 className="font-semibold text-gray-900">Fee Preview (Upfront Collection)</h4>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">One-time Fees Total</span>
                                        <span className="font-medium">RM {preview.oneTimeTotal.toFixed(2)}</span>
                                    </div>

                                    {preview.waivedTotal > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Waived for Returning Student</span>
                                            <span>- RM {preview.waivedTotal.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Monthly Fees (RM {preview.monthlyTotal.toFixed(2)} × {preview.upfrontMonths} mo)</span>
                                        <span className="font-medium">RM {preview.upfrontMonthlyTotal.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-base">
                                        <span>Total Upfront</span>
                                        <span>RM {preview.finalUpfrontTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAssign}
                            disabled={!selectedPackageId || isPending}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Selection
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
