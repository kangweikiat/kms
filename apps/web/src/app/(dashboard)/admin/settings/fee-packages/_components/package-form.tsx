'use client'

import { useState } from 'react'
import { createFeePackage, updateFeePackage, FeePackageItemInput } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { EnrollmentLevel, BillingPeriod } from '@kms/database'

interface FeeItem {
    id: string
    name: string
    code: string
    defaultAmount: number
}

interface PackageFormProps {
    academicYears: { id: string; year: number }[]
    feeItems: FeeItem[]
    initialData?: {
        id: string
        name: string
        description: string | null
        level: string
        academicYearId: string
        billingPeriod: string
        isActive: boolean
        feePackageItems: {
            feeItemId: string
            quantity: number
            unitAmount: number | null
        }[]
    }
}

export function PackageForm({ academicYears, feeItems, initialData }: PackageFormProps) {
    const isEdit = !!initialData
    const router = useRouter()

    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedItems, setSelectedItems] = useState<FeePackageItemInput[]>(
        initialData?.feePackageItems || []
    )

    const addItem = () => {
        if (feeItems.length === 0) return
        setSelectedItems([...selectedItems, { feeItemId: feeItems[0].id, quantity: 1, unitAmount: null }])
    }

    const removeItem = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: keyof FeePackageItemInput, value: any) => {
        const newItems = [...selectedItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setSelectedItems(newItems)
    }

    const calculateSubtotal = () => {
        return selectedItems.reduce((acc, item) => {
            const feeItem = feeItems.find(f => f.id === item.feeItemId)
            if (!feeItem) return acc
            const price = item.unitAmount !== null ? item.unitAmount : feeItem.defaultAmount
            return acc + (price * item.quantity)
        }, 0)
    }

    const formatPeriod = (period: string) => {
        return period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsPending(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('name') as string,
            level: formData.get('level') as EnrollmentLevel,
            academicYearId: formData.get('academicYearId') as string,
            billingPeriod: formData.get('billingPeriod') as BillingPeriod,
            description: formData.get('description') as string,
            isActive: isEdit ? formData.get('isActive') === 'true' : true
        }

        const action = isEdit && initialData
            ? updateFeePackage.bind(null, initialData.id, data, selectedItems)
            : createFeePackage.bind(null, data, selectedItems)

        const result = await action()

        if (result.error) {
            setError(result.error)
            setIsPending(false)
        } else {
            router.push('/admin/settings/fee-packages')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Package Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">Package Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            defaultValue={initialData?.name}
                            placeholder="e.g. M2 First Half-Year Startup Package"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="level" className="text-sm font-medium text-gray-700">Level <span className="text-red-500">*</span></label>
                        <select
                            name="level"
                            id="level"
                            required
                            defaultValue={initialData?.level || ''}
                            className="w-full px-3 py-2 border bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="" disabled>Select Level</option>
                            {Object.values(EnrollmentLevel).map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="academicYearId" className="text-sm font-medium text-gray-700">Academic Year <span className="text-red-500">*</span></label>
                        <select
                            name="academicYearId"
                            id="academicYearId"
                            required
                            defaultValue={initialData?.academicYearId || ''}
                            className="w-full px-3 py-2 border bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="" disabled>Select Year</option>
                            {academicYears.map(year => (
                                <option key={year.id} value={year.id}>{year.year} Intake</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="billingPeriod" className="text-sm font-medium text-gray-700">Billing Period <span className="text-red-500">*</span></label>
                        <select
                            name="billingPeriod"
                            id="billingPeriod"
                            required
                            defaultValue={initialData?.billingPeriod || ''}
                            className="w-full px-3 py-2 border bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="" disabled>Select Period</option>
                            {Object.values(BillingPeriod).map(period => (
                                <option key={period} value={period}>{formatPeriod(period)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            id="description"
                            rows={2}
                            defaultValue={initialData?.description || ''}
                            placeholder="Optional details about this package..."
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
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Fee Items in Package</h2>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                </div>

                {selectedItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <p>No fee items added yet.</p>
                        <p className="text-sm mt-1">Click "Add Item" to add charges to this package.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-3 pb-2 border-b text-sm font-medium text-gray-600">
                            <div className="col-span-12 md:col-span-5">Fee Item</div>
                            <div className="col-span-4 md:col-span-2 text-center">Amount (RM)</div>
                            <div className="col-span-4 md:col-span-2 text-center">Qty</div>
                            <div className="col-span-4 md:col-span-2 text-right">Total</div>
                            <div className="col-span-12 md:col-span-1 text-right"></div>
                        </div>

                        {selectedItems.map((item, index) => {
                            const currentFeeDef = feeItems.find(f => f.id === item.feeItemId)
                            const displayPrice = item.unitAmount !== null ? item.unitAmount : (currentFeeDef?.defaultAmount || 0)
                            const rowTotal = displayPrice * item.quantity

                            return (
                                <div key={index} className="grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-12 md:col-span-5">
                                        <select
                                            value={item.feeItemId}
                                            onChange={(e) => updateItem(index, 'feeItemId', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border bg-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            {feeItems.map(f => (
                                                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={item.unitAmount === null ? '' : item.unitAmount}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                updateItem(index, 'unitAmount', val === '' ? null : parseFloat(val))
                                            }}
                                            placeholder={currentFeeDef?.defaultAmount.toFixed(2) || '0.00'}
                                            className="w-full px-2 py-1.5 text-sm text-center border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            title="Leave empty to use default amount"
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-full px-2 py-1.5 text-sm text-center border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2 text-right font-medium text-gray-900 text-sm py-1.5">
                                        {rowTotal.toFixed(2)}
                                    </div>
                                    <div className="col-span-12 md:col-span-1 text-right">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                        >
                                            <Trash2 className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                            <div className="text-right">
                                <span className="text-sm font-medium text-gray-600 mr-4">Package Subtotal:</span>
                                <span className="text-xl font-bold text-gray-900">RM {calculateSubtotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                <Link
                    href="/admin/settings/fee-packages"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isPending || selectedItems.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEdit ? 'Save Changes' : 'Create Package'}
                </button>
            </div>
        </form>
    )
}
