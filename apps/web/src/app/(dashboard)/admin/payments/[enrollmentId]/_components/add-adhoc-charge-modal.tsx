'use client'

import { useState, useTransition } from 'react'
import { createAdhocCharge } from '../../actions'
import { Loader2, PlusCircle } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface AddAdhocChargeModalProps {
    enrollmentId: string
}

export function AddAdhocChargeModal({ enrollmentId }: AddAdhocChargeModalProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [amountDue, setAmountDue] = useState('')
    const [isPending, startTransition] = useTransition()

    const handleCreate = () => {
        if (!name || !amountDue) return

        startTransition(async () => {
            const result = await createAdhocCharge({
                enrollmentId,
                name,
                amountDue: parseFloat(amountDue)
            })

            if (result.success) {
                setOpen(false)
                setName('')
                setAmountDue('')
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition">
                    <PlusCircle className="w-4 h-4" />
                    New Charge
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-[60] overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                            Add Custom Charge
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-gray-500 mt-1">
                            Add a one-time ad-hoc charge (e.g., extra books or uniform) to this student's ledger.
                        </Dialog.Description>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Item Description</label>
                            <input
                                type="text"
                                placeholder="e.g. Extra PE Uniform Set"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Amount Due (RM)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="any"
                                placeholder="0.00"
                                value={amountDue}
                                onChange={(e) => setAmountDue(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
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
                            onClick={handleCreate}
                            disabled={!name || !amountDue || isPending}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Creates Charge
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
