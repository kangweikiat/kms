'use client'

import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { hardDeleteStudent } from '../actions'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

import { useRouter } from 'next/navigation'

interface HardDeleteButtonProps {
    id: string
    year: number
    redirectTo?: string
}

export function HardDeleteButton({ id, year, redirectTo }: HardDeleteButtonProps) {
    const [isPending, startTransition] = useTransition()
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        startTransition(async () => {
            const result = await hardDeleteStudent(id, year)
            if (result.success) {
                toast.success('Student record permanently deleted')
                setIsOpen(false)
                if (redirectTo) {
                    router.push(redirectTo)
                }
            } else {
                toast.error(result.message)
            }
        })
    }

    return (
        <>
            <button
                disabled={isPending}
                onClick={() => setIsOpen(true)}
                className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                title="Hard Delete (Permanent)"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <ConfirmDialog
                isOpen={isOpen}
                title="Permanently Delete Student?"
                description={`This action cannot be undone. This will permanently remove the student's entire profile, including all historical enrollments, generated fees, invoices, and payments. Everything related to this student will be wiped.`}
                confirmText={isPending ? "Deleting..." : "Permanently Delete"}
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setIsOpen(false)}
            />
        </>
    )
}
