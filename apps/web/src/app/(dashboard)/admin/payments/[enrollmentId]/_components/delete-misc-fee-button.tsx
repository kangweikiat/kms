'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteMiscFee } from '../../actions'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { usePageRefresh } from './page-loading-provider'

export function DeleteMiscFeeButton({ miscFeeId, itemName }: { miscFeeId: string, itemName: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const { refreshPage } = usePageRefresh()

    const handleDelete = async () => {
        setIsLoading(true)
        const res = await deleteMiscFee(miscFeeId)
        setIsLoading(false)

        if (!res.success) {
            alert(res.error || "Failed to delete fee.")
        } else {
            setModalOpen(false)
            refreshPage()
        }
    }

    return (
        <>
            <button
                onClick={() => setModalOpen(true)}
                disabled={isLoading}
                className={`p-1.5 ml-2 rounded-md bg-white border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 hover:border-red-200 transition shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Delete Fee"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            <ConfirmationModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title="Delete Ad-hoc Fee"
                description={`Are you sure you want to delete the completely unpaid fee "${itemName}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                isProcessing={isLoading}
                confirmText="Delete Fee"
                cancelText="Keep"
                variant="danger"
            />
        </>
    )
}
