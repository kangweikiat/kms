'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X } from 'lucide-react'
import { logPayment } from '../../actions'

export function LogPaymentModal({
    enrollmentId,
    monthlyFeeInstanceId,
    bookInstanceId,
    miscFeeId,
    itemName,
    amountDue
}: {
    enrollmentId: string
    monthlyFeeInstanceId?: string
    bookInstanceId?: string
    miscFeeId?: string
    itemName: string
    amountDue: number
}) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState<number>(amountDue)
    const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'ONLINE'>('CASH')
    const [note, setNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (amount <= 0 || amount > amountDue) return

        setIsSubmitting(true)
        const res = await logPayment({
            enrollmentId,
            monthlyFeeInstanceId,
            bookInstanceId,
            miscFeeId,
            amountPaid: amount,
            method,
            note: note || undefined
        })

        if (res.success) {
            setOpen(false)
            router.refresh()
        } else {
            alert(res.error)
        }
        setIsSubmitting(false)
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Pay
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <Dialog.Title className="text-lg font-bold text-gray-900">
                            Log Payment for {itemName}
                        </Dialog.Title>
                        <Dialog.Close className="text-gray-400 hover:text-gray-600 p-1">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount Outstanding (Max RM {amountDue.toFixed(2)})
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">RM</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={amountDue}
                                        required
                                        value={amount || ''}
                                        onChange={e => setAmount(parseFloat(e.target.value))}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={method}
                                    onChange={e => setMethod(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="ONLINE">Online Payment / Stripe</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Note (Optional)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="e.g. Receipt #12345"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={isSubmitting || amount > amountDue || amount <= 0}
                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
                            >
                                {isSubmitting ? 'Recording...' : 'Record Payment'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
