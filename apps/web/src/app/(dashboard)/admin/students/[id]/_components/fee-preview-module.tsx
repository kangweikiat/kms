'use client'

import { useState, useEffect } from 'react'
import { getFeePreviewData, upsertFeeAdjustment, removeFeeAdjustment } from '../../fee-preview-actions'
import { Calculator, CheckCircle2, AlertCircle, Edit2, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

type FeePreviewModuleProps = {
    enrollmentId: string
    studentId: string
    feePackageName?: string
}

export function FeePreviewModule({ enrollmentId, studentId, feePackageName }: FeePreviewModuleProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false)

    // Form state for adjustments
    const [adjustingItemId, setAdjustingItemId] = useState<string | null>(null)
    const [adjustAmount, setAdjustAmount] = useState<string>('')
    const [adjustReason, setAdjustReason] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        const res = await getFeePreviewData(enrollmentId)
        if (res.success && res.data) {
            setData(res.data)
            setError(null)
        } else {
            setError(res.error || 'Failed to fetch fee preview')
        }
        setLoading(false)
    }

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, enrollmentId])

    const handleSaveAdjustment = async (feeItemId: string) => {
        if (!adjustAmount || isNaN(Number(adjustAmount))) return
        setSubmitting(true)
        const amount = Number(adjustAmount)
        const res = await upsertFeeAdjustment(enrollmentId, feeItemId, amount, adjustReason, studentId)
        if (res.success) {
            setAdjustingItemId(null)
            setAdjustAmount('')
            setAdjustReason('')
            await fetchData()
        } else {
            alert(res.error)
        }
        setSubmitting(false)
    }

    const handleRemoveAdjustment = async (adjustmentId: string) => {
        if (!confirm('Are you sure you want to remove this custom adjustment?')) return
        setSubmitting(true)
        const res = await removeFeeAdjustment(adjustmentId, studentId)
        if (res.success) {
            await fetchData()
        } else {
            alert(res.error)
        }
        setSubmitting(false)
    }

    if (!feePackageName) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 italic mt-2">
                <AlertCircle className="w-4 h-4" />
                No fee package assigned yet
            </div>
        )
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Preview & Setup Fees
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0">
                        <div>
                            <Dialog.Title className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-blue-600" />
                                Fee Setup & Preview
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-gray-500 mt-1">
                                Customise waivers and view the initial billing calculation for <span className="font-semibold text-gray-900">{feePackageName}</span>.
                            </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-gray-500 p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        ) : data ? (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="text-sm font-medium text-gray-500 mb-1">One-Time Total</div>
                                        <div className="text-xl font-bold text-gray-900">RM {data.totalOneTime.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="text-sm font-medium text-blue-800 mb-1">Monthly Upfront ({data.upfrontMonths} mo)</div>
                                        <div className="text-xl font-bold text-blue-900">RM {data.totalMonthlyUpfront.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
                                        <div className="text-sm font-medium text-green-800 mb-1 flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> Grand Total
                                        </div>
                                        <div className="text-2xl font-bold text-green-700">RM {data.totalUpfront.toFixed(2)}</div>
                                    </div>
                                </div>

                                {/* Rendering Line Items */}
                                <div className="space-y-6">
                                    {/* One Time Fees */}
                                    {data.oneTimeFees.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2 flex justify-between items-center">
                                                One-Time / Annual Fees
                                            </h4>
                                            <div className="space-y-3">
                                                {data.oneTimeFees.map((item: any) => (
                                                    <FeeItemRow
                                                        key={item.feeItemId}
                                                        item={item}
                                                        adjustingItemId={adjustingItemId}
                                                        setAdjustingItemId={setAdjustingItemId}
                                                        adjustAmount={adjustAmount}
                                                        setAdjustAmount={setAdjustAmount}
                                                        adjustReason={adjustReason}
                                                        setAdjustReason={setAdjustReason}
                                                        handleSaveAdjustment={handleSaveAdjustment}
                                                        handleRemoveAdjustment={handleRemoveAdjustment}
                                                        submitting={submitting}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Monthly Fees */}
                                    {data.monthlyFees.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2 flex justify-between items-center">
                                                Monthly Fees <span className="text-xs text-gray-500 tracking-normal capitalize font-normal">(x{data.upfrontMonths} months upfront)</span>
                                            </h4>
                                            <div className="space-y-3">
                                                {data.monthlyFees.map((item: any) => (
                                                    <FeeItemRow
                                                        key={item.feeItemId}
                                                        item={item}
                                                        adjustingItemId={adjustingItemId}
                                                        setAdjustingItemId={setAdjustingItemId}
                                                        adjustAmount={adjustAmount}
                                                        setAdjustAmount={setAdjustAmount}
                                                        adjustReason={adjustReason}
                                                        setAdjustReason={setAdjustReason}
                                                        handleSaveAdjustment={handleSaveAdjustment}
                                                        handleRemoveAdjustment={handleRemoveAdjustment}
                                                        submitting={submitting}
                                                        isMonthly
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

function FeeItemRow({ item, adjustingItemId, setAdjustingItemId, adjustAmount, setAdjustAmount, adjustReason, setAdjustReason, handleSaveAdjustment, handleRemoveAdjustment, submitting, isMonthly = false }: any) {
    const isEditing = adjustingItemId === item.feeItemId

    return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm group">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.quantity > 1 && <span className="text-xs text-gray-500">x{item.quantity}</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                        Base: RM {item.baseCost.toFixed(2)} {isMonthly && '/ mo'}
                    </div>

                    {/* Show existing adjustments */}
                    {item.isAdjusted && (
                        <div className={`mt-2 text-xs flex items-center gap-2 ${item.isWaiver ? 'text-green-700 bg-green-50 border-green-200' : 'text-orange-700 bg-orange-50 border-orange-200'} px-2 py-1 rounded border inline-flex`}>
                            <span>
                                {item.adjustmentAmount < 0 ? '-' : '+'} RM {Math.abs(item.adjustmentAmount).toFixed(2)} ({item.adjustmentReason})
                            </span>
                            {!item.isWaiver && item.dbAdjustmentId && (
                                <button onClick={() => handleRemoveAdjustment(item.dbAdjustmentId)} className="ml-2 hover:text-orange-900" disabled={submitting}>
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                    <div className="font-bold text-gray-900">
                        RM {item.finalLineCost.toFixed(2)}
                    </div>
                    {/* Actions */}
                    {!isEditing && !item.isWaiver && (
                        <button
                            onClick={() => {
                                setAdjustingItemId(item.feeItemId)
                                setAdjustAmount(item.dbAdjustmentId ? String(item.adjustmentAmount) : '')
                                setAdjustReason(item.dbAdjustmentId ? item.adjustmentReason : '')
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                        >
                            <Edit2 className="w-3 h-3" /> Adjust
                        </button>
                    )}
                </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
                <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50 -mx-3 -mb-3 p-3 rounded-b-lg flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full space-y-1">
                        <label className="text-xs font-medium text-gray-600">Adjustment Amount (RM)</label>
                        <input
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            placeholder="-50.00"
                            className="w-full text-sm border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-[10px] text-gray-500">Use negative numbers for discounts.</p>
                    </div>
                    <div className="flex-[2] w-full space-y-1">
                        <label className="text-xs font-medium text-gray-600">Reason</label>
                        <input
                            type="text"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            placeholder="e.g. Sibling Discount"
                            className="w-full text-sm border rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto pb-1 sm:pb-0">
                        <button
                            onClick={() => setAdjustingItemId(null)}
                            disabled={submitting}
                            className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSaveAdjustment(item.feeItemId)}
                            disabled={submitting || !adjustAmount}
                            className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
