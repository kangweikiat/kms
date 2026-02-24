'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { setYearCookie } from '@/app/actions'
import { useTransition } from 'react'
import { AcademicYear } from '@kms/database'

interface YearSelectProps {
    initialYear: number
    availableYears?: AcademicYear[]
}

export function YearSelect({ initialYear, availableYears = [] }: YearSelectProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Priority: URL param > Server Cookie (initialYear) > Default
    const currentYear = Number(searchParams.get('year')) || initialYear

    // Use DB years if available, fallback to default logic if empty (e.g. before seeding)
    // If DB is empty, user needs to go to settings to add years.
    // For now, if empty, let's just show current year to avoid broken UI.
    const hasYears = availableYears.length > 0
    const years = hasYears ? availableYears : [{ year: 2026, status: 'ACTIVE', id: 'default' }]

    const handleYearChange = (year: string) => {
        const yearNum = Number(year)

        // 1. Update Cookie via Server Action
        startTransition(() => {
            setYearCookie(yearNum)
        })

        // 2. Update URL
        const params = new URLSearchParams(searchParams.toString())
        params.set('year', year)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm">
            <Calendar className={`w-4 h-4 text-gray-500 ${isPending ? 'animate-pulse' : ''}`} />
            <select
                value={currentYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="text-sm font-medium text-gray-900 bg-transparent border-none focus:ring-0 cursor-pointer disabled:opacity-50"
                disabled={isPending}
            >
                {years.map((y) => (
                    <option key={y.id} value={y.year}>
                        {y.year} Intake {hasYears && y.status !== 'ACTIVE' ? `(${y.status})` : ''}
                    </option>
                ))}
            </select>
        </div>
    )
}
