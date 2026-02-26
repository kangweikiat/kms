'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, PowerOff, Power, Trash2 } from 'lucide-react'
import { deleteBuilding, toggleBuildingStatus } from '../actions'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface BuildingActionsProps {
    id: string
    isActive: boolean
}

export function BuildingActions({ id, isActive }: BuildingActionsProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const handleToggleStatus = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await toggleBuildingStatus(id, !isActive)
            if (result.success) {
                toast.success(`Building ${isActive ? 'deactivated' : 'activated'} successfully`)
                setIsMenuOpen(false)
            } else {
                toast.error(result.error)
            }
        })
    }

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await deleteBuilding(id)
            if (result.success) {
                toast.success('Building deleted successfully')
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
                title={isActive ? 'Deactivate Building' : 'Activate Building'}
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
                title="Delete Building"
            >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
            </button>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Delete Building?"
                description="Are you sure you want to delete this building? This action cannot be undone. If there are classes assigned, you must deactivate it instead."
                confirmText={isPending ? "Deleting..." : "Delete"}
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />
        </div>
    )
}
