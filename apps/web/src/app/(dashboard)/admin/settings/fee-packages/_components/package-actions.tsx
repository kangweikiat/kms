'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'
import { deleteFeePackage } from '../actions'

export function PackageActions({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        setError(null)
        const result = await deleteFeePackage(id)
        if (result.error) {
            setError(result.error)
            setIsDeleting(false)
            setTimeout(() => setError(null), 3000)
        } else {
            setShowDeleteConfirm(false)
            setIsDeleting(false)
            router.refresh()
        }
    }

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete Fee Package"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {showDeleteConfirm && (
                <div className="absolute right-0 top-10 mt-2 w-72 bg-white rounded-xl shadow-xl border border-red-100 p-4 z-50">
                    <div className="flex gap-3 mb-3 text-red-600">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold">Delete Package?</h4>
                            <p className="text-xs text-red-500 mt-1">This action cannot be undone.</p>
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center justify-center min-w-[70px] px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                        >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                        </button>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    )
}
