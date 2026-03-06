'use client'

import { useState } from 'react'
import { Undo2 } from 'lucide-react'
import { cancelPayment } from '../../actions'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

export function CancelPaymentButton({ paymentId }: { paymentId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)

    const handleCancel = async () => {
        setIsLoading(true)
        const res = await cancelPayment(paymentId)
        setIsLoading(false)

        if (!res.success) {
            alert(res.error || "Failed to cancel payment.")
        } else {
            setModalOpen(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                disabled={isLoading}
                className={`p-1.5 ml-2 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Cancel Payment"
            >
                <Undo2 className="w-4 h-4" />
            </button>
            <ConfirmationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title="Cancel Payment"
                description="Are you sure you want to cancel and delete this payment? This action will permanently remove the transaction and update the student's balance."
                onConfirm={handleCancel}
                isProcessing={isLoading}
                confirmText="Cancel Payment"
                cancelText="Keep Default"
                variant="danger"
            />
        </>
    )
}
