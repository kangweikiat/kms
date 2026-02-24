'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, PowerOff, Power, Trash2 } from 'lucide-react'
import { deleteClass, toggleClassStatus } from '../actions'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ClassActionsProps {
    id: string
    isActive: boolean
}

export function ClassActions({ id, isActive }: ClassActionsProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const handleToggleStatus = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await toggleClassStatus(id, !isActive)
            if (result.success) {
                toast.success(`Class ${isActive ? 'deactivated' : 'activated'} successfully`)
                setIsMenuOpen(false)
            } else {
                toast.error(result.error)
            }
        })
    }

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await deleteClass(id)
            if (result.success) {
                toast.success('Class deleted successfully')
                setIsDeleteDialogOpen(false)
                setIsMenuOpen(false)
            } else {
                toast.error(result.error)
                setIsDeleteDialogOpen(false)
            }
        })
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleToggleStatus}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                title={isActive ? 'Deactivate Class' : 'Activate Class'}
            >
                {isActive ? (
                    <PowerOff className="w-4 h-4 text-orange-500" />
                ) : (
                    <Power className="w-4 h-4 text-green-500" />
                )}
            </button>
            <button
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                title="Delete Class"
            >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
            </button>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Delete Class?"
                description="Are you sure you want to delete this class? This action cannot be undone. You cannot delete a class if it has enrolled students."
                confirmText={isPending ? "Deleting..." : "Delete"}
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />
        </div>
    )
}
