'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface BuildingFilterProps {
    buildings: { id: string; name: string }[]
    currentBuilding?: string
}

export function BuildingFilter({ buildings, currentBuilding }: BuildingFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set('building', value)
        } else {
            params.delete('building')
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <select
            value={currentBuilding || ''}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
        >
            <option value="">All Buildings</option>
            {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
            ))}
        </select>
    )
}
