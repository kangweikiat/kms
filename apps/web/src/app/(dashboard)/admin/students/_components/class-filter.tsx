'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface ClassFilterProps {
    classes: { id: string; name: string }[]
    currentClass?: string
}

export function ClassFilter({ classes, currentClass }: ClassFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        const params = new URLSearchParams(searchParams.toString())

        if (value) {
            params.set('class', value)
        } else {
            params.delete('class')
        }

        // Reset page to 1 on filter change to avoid empty states
        params.delete('page')

        router.push(`?${params.toString()}`)
    }

    return (
        <select
            value={currentClass || ''}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none min-w-[140px]"
        >
            <option value="">All Classes</option>
            <option value="unassigned">Unassigned</option>
            <optgroup label="Classes">
                {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </optgroup>
        </select>
    )
}
