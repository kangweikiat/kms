'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function StatusFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const view = searchParams.get('view') || 'active'

    const handleFilterChange = (newView: string) => {
        const params = new URLSearchParams(searchParams)
        if (newView === 'active') {
            params.delete('view')
        } else {
            params.set('view', newView)
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => handleFilterChange('active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'active'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Active
            </button>
            <button
                onClick={() => handleFilterChange('inactive')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'inactive'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                Inactive
            </button>
        </div>
    )
}
