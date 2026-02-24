'use client'

import { toast } from 'sonner'

import { Trash2 } from 'lucide-react'
import { deleteStudent } from '../actions'
import { useTransition, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function DeleteButton({ id, year }: { id: string; year: number }) {
    const [isPending, startTransition] = useTransition()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await deleteStudent(id, year)
            if (result.success) {
                toast.success('Student withdrawn from ' + year + ' intake')
            } else {
                toast.error(result.message || 'Failed to delete student')
            }
            setIsDialogOpen(false)
        })
    }

    return (
        <>
            <button
                onClick={() => setIsDialogOpen(true)}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                title="Delete Student from this Year"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <ConfirmDialog
                isOpen={isDialogOpen}
                title="Delete Student"
                description={`Are you sure you want to remove this student from the ${year} intake? This will mark them as withdrawn for this year only.`}
                confirmText="Withdraw"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setIsDialogOpen(false)}
            />
        </>
    )
}
