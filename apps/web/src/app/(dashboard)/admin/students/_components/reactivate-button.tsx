'use client'

import { RefreshCw } from 'lucide-react'
import { reactivateStudent } from '../actions'
import { useTransition, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function ReactivateButton({ id, year }: { id: string, year: number }) {
    const [isPending, startTransition] = useTransition()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleReactivate = async () => {
        startTransition(async () => {
            await reactivateStudent(id, year)
            setIsDialogOpen(false)
        })
    }

    return (
        <>
            <button
                onClick={() => setIsDialogOpen(true)}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                title="Reactivate Student"
            >
                <RefreshCw className="w-4 h-4" />
            </button>

            <ConfirmDialog
                isOpen={isDialogOpen}
                title="Reactivate Student"
                description="Are you sure you want to reactivate this student? They will be moved back to the active list."
                confirmText="Reactivate"
                variant="info"
                onConfirm={handleReactivate}
                onCancel={() => setIsDialogOpen(false)}
            />
        </>
    )
}
