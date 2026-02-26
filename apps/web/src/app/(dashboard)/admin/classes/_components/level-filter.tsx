'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { EnrollmentLevel } from '@kms/database'

interface LevelFilterProps {
    currentLevel?: string
}

export function LevelFilter({ currentLevel }: LevelFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set('level', value)
        } else {
            params.delete('level')
        }
        router.push(`?${params.toString()}`)
    }

    const levels = Object.values(EnrollmentLevel) as string[]

    return (
        <select
            value={currentLevel || ''}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
        >
            <option value="">All Levels</option>
            {levels.map(level => (
                <option key={level} value={level}>{level}</option>
            ))}
        </select>
    )
}
