'use client'

import { useState, useTransition } from 'react'
import { removeStudentFromClass } from '../../actions'
import { toast } from 'sonner'
import { UserMinus, Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface RemoveStudentButtonProps {
    enrollmentId: string
    classId: string
    studentName: string
}

export function RemoveStudentButton({ enrollmentId, classId, studentName }: RemoveStudentButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleRemove = async () => {
        startTransition(async () => {
            const result = await removeStudentFromClass(classId, enrollmentId)
            if (result.success) {
                toast.success('Student removed from class successfully')
                setIsDialogOpen(false)
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsDialogOpen(true)}
                disabled={isPending}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Remove from class"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
            </button>

            <ConfirmDialog
                isOpen={isDialogOpen}
                title="Remove Student from Class?"
                description={`Are you sure you want to remove ${studentName} from this class? They will return to the unassigned student pool.`}
                confirmText={isPending ? "Removing..." : "Remove Student"}
                variant="danger"
                onConfirm={handleRemove}
                onCancel={() => setIsDialogOpen(false)}
            />
        </>
    )
}
