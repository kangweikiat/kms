'use client'

import { useActionState } from 'react'
import { createBuilding, updateBuilding } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface BuildingFormProps {
    initialData?: {
        id: string
        name: string
        description: string | null
        isActive: boolean
    }
}

export function BuildingForm({ initialData }: BuildingFormProps) {
    const isEdit = !!initialData
    const router = useRouter()

    const action = isEdit && initialData
        ? async (prevState: any, formData: FormData) => updateBuilding(initialData.id, prevState, formData)
        : createBuilding
    const [state, formAction, isPending] = useActionState(action, null)

    if (state?.success) {
        router.push('/admin/settings/buildings')
    }

    return (
        <form action={formAction} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {state.error}
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Building Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        defaultValue={initialData?.name}
                        placeholder="e.g. Maria 1"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        defaultValue={initialData?.description || ''}
                        placeholder="Optional details about this location..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {isEdit && (
                    <div className="space-y-2">
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
                    href="/admin/settings/buildings"
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
                    {isEdit ? 'Save Changes' : 'Add Building'}
                </button>
            </div>
        </form>
    )
}
