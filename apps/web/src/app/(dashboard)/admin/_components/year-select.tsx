'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

export function YearSelect() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentYear = Number(searchParams.get('year')) || 2026

    const handleYearChange = (year: string) => {
        router.push(`/admin?year=${year}`)
        router.refresh()
    }

    return (
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
                value={currentYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="text-sm font-medium text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
                <option value={2026}>2026 Intake</option>
                <option value={2027}>2027 Intake</option>
            </select>
        </div>
    )
}
