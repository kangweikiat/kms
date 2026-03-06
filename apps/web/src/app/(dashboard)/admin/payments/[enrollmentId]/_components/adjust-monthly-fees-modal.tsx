'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Settings, X, AlertCircle } from 'lucide-react'
import { applyMonthlyFeeAdjustment, restoreMonthlyFeeAmount } from '../../actions'

type AdjustmentType = 'WAIVE' | 'PERCENT' | 'FIXED_AMOUNT' | 'RESTORE'

export function AdjustMonthlyFeesModal({
    enrollmentId,
    monthlyFeeInstances
}: {
    enrollmentId: string
    monthlyFeeInstances: any[]
}) {
    const [open, setOpen] = useState(false)
    const [selectedMonths, setSelectedMonths] = useState<number[]>([])
    const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('WAIVE')
    const [percent, setPercent] = useState<number>(0)
    const [fixedAmount, setFixedAmount] = useState<number>(0)
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const router = useRouter()
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    // Sort instances chronologically
    const sortedInstances = [...monthlyFeeInstances].sort((a, b) => a.month - b.month)

    const toggleMonth = (month: number) => {
        setSelectedMonths(prev =>
            prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
        )
    }

    const selectAll = () => {
        const available = sortedInstances.filter(inst => inst.payments.length === 0).map(inst => inst.month)
        setSelectedMonths(available)
    }

    const resetForm = () => {
        setSelectedMonths([])
        setAdjustmentType('WAIVE')
        setPercent(0)
        setFixedAmount(0)
        setReason('')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (selectedMonths.length === 0) return
        if (!reason.trim()) return

        setIsSubmitting(true)

        try {
            if (adjustmentType === 'RESTORE') {
                const res = await restoreMonthlyFeeAmount({
                    enrollmentId,
                    months: selectedMonths,
                    reason,
                })
                if (res.success) {
                    setOpen(false)
                    router.refresh()
                } else {
                    alert(res.error)
                }
            } else {
                const res = await applyMonthlyFeeAdjustment({
                    enrollmentId,
                    months: selectedMonths,
                    type: adjustmentType,
                    percent: adjustmentType === 'PERCENT' ? percent : undefined,
                    fixedAmount: adjustmentType === 'FIXED_AMOUNT' ? fixedAmount : undefined,
                    reason,
                })
                if (res.success) {
                    setOpen(false)
                    router.refresh()
                } else {
                    alert(res.error)
                }
            }
        } catch (error: any) {
            alert('An unexpected error occurred.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={(val) => {
            if (val) resetForm()
            setOpen(val)
        }}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium border border-gray-200">
                    <Settings className="w-4 h-4" />
                    Adjust Fees
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl z-[10000] flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-500" />
                            Adjust Monthly Fees
                        </Dialog.Title>
                        <Dialog.Close className="text-gray-400 hover:text-gray-600 p-1">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                        <div className="p-6 space-y-6 overflow-y-auto">

                            {/* Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                                <p>You can only adjust months that have <strong>no recorded payments</strong>. Months with partial or full payments are locked.</p>
                            </div>

                            {/* Month Selection */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-900">Select Months</h3>
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="text-xs text-blue-600 font-medium hover:underline"
                                    >
                                        Select All Eligible
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {sortedInstances.map((inst) => {
                                        const isLocked = inst.payments.length > 0;
                                        const isSelected = selectedMonths.includes(inst.month);
                                        return (
                                            <label
                                                key={inst.id}
                                                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${isLocked ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' :
                                                        isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => !isLocked && toggleMonth(inst.month)}
                                                    disabled={isLocked}
                                                    className="mt-0.5 shrink-0 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                                />
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                                                        {MONTH_NAMES[inst.month - 1]}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        RM {inst.amountDue.toFixed(2)}
                                                        {inst.originalAmountDue !== null && (
                                                            <span className="ml-1 line-through text-gray-400">RM {inst.originalAmountDue.toFixed(2)}</span>
                                                        )}
                                                    </span>
                                                    {isLocked && <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mt-1">Locked (Paid)</span>}
                                                    {!isLocked && inst.adjustmentType !== null && <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mt-1">Adjusted</span>}
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                                {selectedMonths.length === 0 && (
                                    <p className="text-xs text-red-500">Please select at least one month.</p>
                                )}
                            </div>

                            {/* Adjustment Settings */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-5">
                                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">Configuration</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Action</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {(['WAIVE', 'PERCENT', 'FIXED_AMOUNT', 'RESTORE'] as AdjustmentType[]).map(type => (
                                            <label key={type} className={`
                                                flex items-center justify-center p-2 text-sm font-medium border rounded-md cursor-pointer transition text-center
                                                ${adjustmentType === type ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                                            `}>
                                                <input
                                                    type="radio"
                                                    name="adjType"
                                                    value={type}
                                                    checked={adjustmentType === type}
                                                    onChange={() => setAdjustmentType(type as AdjustmentType)}
                                                    className="sr-only"
                                                />
                                                {type.replace('_', ' ')}
                                            </label>
                                        ))}
                                    </div>
                                    {adjustmentType === 'RESTORE' && (
                                        <p className="text-xs text-gray-500 mt-2">Restores the amount due back to the original price, removing any previous adjustments.</p>
                                    )}
                                </div>

                                {/* Conditional Inputs */}
                                {adjustmentType === 'PERCENT' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Percentage to Charge (%)</label>
                                        <p className="text-xs text-gray-500 mb-2">E.g., enter 80 to charge 80% of the normal tuition (giving a 20% discount).</p>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                required
                                                value={percent || ''}
                                                onChange={e => setPercent(parseFloat(e.target.value))}
                                                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                                        </div>
                                    </div>
                                )}

                                {adjustmentType === 'FIXED_AMOUNT' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Amount Due (RM)</label>
                                        <p className="text-xs text-gray-500 mb-2">Enter the exact new price per month.</p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">RM</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                value={fixedAmount || ''}
                                                onChange={e => setFixedAmount(parseFloat(e.target.value))}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="e.g., Absent overseas, Covid discount, etc."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={isSubmitting || selectedMonths.length === 0 || !reason.trim()}
                                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-600 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                {isSubmitting ? 'Processing...' : 'Apply Changes'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
