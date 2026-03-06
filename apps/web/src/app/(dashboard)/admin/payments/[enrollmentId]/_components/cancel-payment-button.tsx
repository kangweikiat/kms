'use client'

import { useState } from 'react'
import { Undo2 } from 'lucide-react'
import { cancelPayment } from '../../actions'

export function CancelPaymentButton({ paymentId }: { paymentId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel and delete this payment? This action cannot be undone.")) {
            return
        }

        setIsLoading(true)
        const res = await cancelPayment(paymentId)
        setIsLoading(false)

        if (!res.success) {
            alert(res.error || "Failed to cancel payment.")
        }
    }

    return (
        <button
            onClick={handleCancel}
            disabled={isLoading}
            className={`p-1.5 ml-2 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Cancel Payment"
        >
            <Undo2 className="w-4 h-4" />
        </button>
    )
}
