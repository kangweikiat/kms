'use client'

import { useActionState } from 'react'
import { createFeeItem, updateFeeItem } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface FeeItemFormProps {
    initialData?: {
        id: string
        name: string
        code: string
        defaultAmount: number
        description: string | null
        isActive: boolean
    }
}

export function FeeItemForm({ initialData }: FeeItemFormProps) {
    const isEdit = !!initialData
    const router = useRouter()

    const action = isEdit && initialData
        ? async (prevState: any, formData: FormData) => updateFeeItem(initialData.id, prevState, formData)
        : createFeeItem

    const [state, formAction, isPending] = useActionState(action, null)

    if (state?.success) {
        router.push('/admin/fee-items')
    }

    return (
        <form action={formAction} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {state.error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        defaultValue={initialData?.name}
                        placeholder="e.g. Registration Fee"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="code" className="text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="code"
                        id="code"
                        required
                        defaultValue={initialData?.code}
                        placeholder="e.g. REG_FEE"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="defaultAmount" className="text-sm font-medium text-gray-700">Default Amount (RM) <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        name="defaultAmount"
                        id="defaultAmount"
                        required
                        min={0}
                        step="0.01"
                        defaultValue={initialData?.defaultAmount}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        id="description"
                        rows={2}
                        defaultValue={initialData?.description || ''}
                        placeholder="Optional details..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {isEdit && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="isActive" value="true" defaultChecked={initialData.isActive === true} className="text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700">Active</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="isActive" value="false" defaultChecked={initialData.isActive === false} className="text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700">Inactive</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Link
                    href="/admin/fee-items"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEdit ? 'Save Changes' : 'Create Fee Item'}
                </button>
            </div>
        </form>
    )
}
