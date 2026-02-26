'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BillingPeriod } from '@kms/database'

interface BillingPeriodFilterProps {
    currentPeriod?: string
}

export function BillingPeriodFilter({ currentPeriod }: BillingPeriodFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set('period', value)
        } else {
            params.delete('period')
        }
        router.push(`?${params.toString()}`)
    }

    const periods = Object.values(BillingPeriod) as string[]

    const formatPeriod = (period: string) => {
        return period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <select
            value={currentPeriod || ''}
            onChange={handleChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
        >
            <option value="">All Periods</option>
            {periods.map(period => (
                <option key={period} value={period}>{formatPeriod(period)}</option>
            ))}
        </select>
    )
}
