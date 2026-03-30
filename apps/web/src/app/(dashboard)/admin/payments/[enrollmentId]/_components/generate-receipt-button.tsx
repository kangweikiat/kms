'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { FileText, X, CheckSquare, Square } from 'lucide-react'
import { generateReceipt } from '../../actions'
import { usePageRefresh } from './page-loading-provider'

type UnreceiptedPayment = {
    id: string
    amountPaid: number
    method: string
    paidAt: string | Date
    note?: string | null
    monthlyFeeInstance?: { feeItem: { name: string }; month: number } | null
    miscFee?: { name: string } | null
    bookInstance?: { feeItem: { name: string }; version: string } | null
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getPaymentDescription(p: UnreceiptedPayment) {
    if (p.monthlyFeeInstance) {
        return `${MONTH_NAMES[(p.monthlyFeeInstance.month - 1)]} School Fee`
    }
    if (p.miscFee) return p.miscFee.name
    if (p.bookInstance) return `${p.bookInstance.feeItem.name} (${p.bookInstance.version})`
    return p.note || 'Payment'
}

export function GenerateReceiptButton({
    enrollmentId,
    unreceiptedPayments
}: {
    enrollmentId: string
    unreceiptedPayments: UnreceiptedPayment[]
}) {
    const [open, setOpen] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [method, setMethod] = useState<'CASH' | 'ONLINE_TRANSFER' | 'TNG'>('CASH')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { refreshPage, isRefreshing } = usePageRefresh()
    const isLoading = isSubmitting || isRefreshing

    function handleOpen(val: boolean) {
        if (val) {
            // Select all by default when opening
            setSelectedIds(new Set(unreceiptedPayments.map(p => p.id)))
        }
        setOpen(val)
    }

    function toggleId(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function toggleAll() {
        if (selectedIds.size === unreceiptedPayments.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(unreceiptedPayments.map(p => p.id)))
        }
    }

    const totalSelected = unreceiptedPayments
        .filter(p => selectedIds.has(p.id))
        .reduce((sum, p) => sum + p.amountPaid, 0)

    async function handleSubmit() {
        if (selectedIds.size === 0) return
        setIsSubmitting(true)
        const res = await generateReceipt({
            enrollmentId,
            paymentIds: Array.from(selectedIds),
            method: method as any
        })
        if (res.success) {
            setOpen(false)
            refreshPage()
        } else {
            alert(res.error)
        }
        setIsSubmitting(false)
    }

    if (unreceiptedPayments.length === 0) return null

    return (
        <Dialog.Root open={open} onOpenChange={handleOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium">
                    <FileText className="w-4 h-4" />
                    Generate Receipt
                    <span className="bg-emerald-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {unreceiptedPayments.length}
                    </span>
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Generate Receipt
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 rounded hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        Select which unreceipted payments to include in this receipt.
                    </p>

                    {/* Select All */}
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-3"
                    >
                        {selectedIds.size === unreceiptedPayments.length
                            ? <CheckSquare className="w-4 h-4" />
                            : <Square className="w-4 h-4" />
                        }
                        {selectedIds.size === unreceiptedPayments.length ? 'Deselect All' : 'Select All'}
                    </button>

                    {/* Payment list */}
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
                        {unreceiptedPayments.map(p => (
                            <label
                                key={p.id}
                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                            >
                                <input
                                    type="checkbox"
                                    className="accent-blue-600 w-4 h-4"
                                    checked={selectedIds.has(p.id)}
                                    onChange={() => toggleId(p.id)}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900">{getPaymentDescription(p)}</div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(p.paidAt).toLocaleDateString()} · {p.method.replace('_', ' ')}
                                        {p.note ? ` · ${p.note}` : ''}
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-800 shrink-0">
                                    RM {p.amountPaid.toFixed(2)}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Payment method */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method for Receipt</label>
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value as any)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="CASH">Cash</option>
                            <option value="ONLINE_TRANSFER">Online Transfer</option>
                            <option value="TNG">TnG</option>
                        </select>
                    </div>

                    {/* Total & actions */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Total: <span className="font-bold text-gray-900">RM {totalSelected.toFixed(2)}</span>
                            <span className="text-gray-400 text-xs ml-1">({selectedIds.size} payment{selectedIds.size !== 1 ? 's' : ''})</span>
                        </div>
                        <div className="flex gap-2">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || selectedIds.size === 0}
                                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isLoading ? 'Generating...' : 'Generate Receipt'}
                            </button>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
