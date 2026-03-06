'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, X } from 'lucide-react'

interface ConfirmationModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    onConfirm: () => void
    isProcessing?: boolean
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'primary'
}

export function ConfirmationModal({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    isProcessing = false,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'danger'
}: ConfirmationModalProps) {
    const getConfirmButtonStyles = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
            case 'warning':
                return 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
            case 'primary':
            default:
                return 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
        }
    }

    const getIconStyles = () => {
        switch (variant) {
            case 'danger': return 'text-red-500 bg-red-100'
            case 'warning': return 'text-amber-500 bg-amber-100'
            case 'primary': return 'text-blue-500 bg-blue-100'
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getIconStyles()}`}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <Dialog.Title className="text-lg font-semibold text-gray-900">
                                {title}
                            </Dialog.Title>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition"
                                aria-label="Close"
                                disabled={isProcessing}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="p-6">
                        <Dialog.Description className="text-gray-600 text-[15px] leading-relaxed">
                            {description}
                        </Dialog.Description>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end gap-3">
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                disabled={isProcessing}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition"
                            >
                                {cancelText}
                            </button>
                        </Dialog.Close>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center min-w-[100px] focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${getConfirmButtonStyles()} ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isProcessing ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
