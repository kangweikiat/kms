'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteMiscFee } from '../../actions'

export function DeleteMiscFeeButton({ miscFeeId, itemName }: { miscFeeId: string, itemName: string }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete the unpaid fee "${itemName}"? This action cannot be undone.`)) {
            return
        }

        setIsLoading(true)
        const res = await deleteMiscFee(miscFeeId)
        setIsLoading(false)

        if (!res.success) {
            alert(res.error || "Failed to delete fee.")
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isLoading}
            className={`p-1.5 ml-2 rounded-md bg-white border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 hover:border-red-200 transition shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Delete Fee"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
