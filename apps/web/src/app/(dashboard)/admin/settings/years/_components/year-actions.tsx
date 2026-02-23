'use client'

import { AcademicYearStatus } from '@kms/database'
import { updateAcademicYearStatus, deleteAcademicYear } from '../actions'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTransition } from 'react'
// If you are using next/navigation for router refresh, helpful but the server action already revalidates.

interface YearActionsProps {
    id: string
    status: AcademicYearStatus
}

export function YearActions({ id, status }: YearActionsProps) {
    const [isPending, startTransition] = useTransition()

    const handleUpdate = (newStatus: AcademicYearStatus) => {
        startTransition(async () => {
            try {
                const result = await updateAcademicYearStatus(id, newStatus)
                if (result?.error) {
                    toast.error(result.error)
                } else {
                    toast.success(`Year updated to ${newStatus}`)
                }
            } catch (e) {
                toast.error('Something went wrong')
            }
        })
    }

    const handleDelete = () => {
        if (!confirm('Are you sure you want to delete this academic year?')) return

        startTransition(async () => {
            const result = await deleteAcademicYear(id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Academic year deleted')
            }
        })
    }

    return (
        <div className="flex justify-end gap-2 items-center">
            <button
                onClick={() => handleUpdate('ACTIVE')}
                disabled={status === 'ACTIVE' || isPending}
                className="text-green-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Activate
            </button>
            <span className="text-gray-300">|</span>
            <button
                onClick={() => handleUpdate('COMPLETED')}
                disabled={status === 'COMPLETED' || isPending}
                className="text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Complete
            </button>
            <span className="text-gray-300">|</span>
            <button
                onClick={() => handleUpdate('INACTIVE')}
                disabled={status === 'INACTIVE' || isPending}
                className="text-gray-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Deactivate
            </button>
            <span className="text-gray-300">|</span>
            <button
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}
