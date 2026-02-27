'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function FeePackageFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentStatus = searchParams.get('feePackage')

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        const params = new URLSearchParams(searchParams.toString())

        if (value) {
            params.set('feePackage', value)
        } else {
            params.delete('feePackage')
        }

        // Reset page to 1 on filter change
        params.delete('page')

        router.push(`?${params.toString()}`)
    }

    return (
        <select
            value={currentStatus || ''}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none min-w-[140px]"
        >
            <option value="">All Fee Packages</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
        </select>
    )
}
