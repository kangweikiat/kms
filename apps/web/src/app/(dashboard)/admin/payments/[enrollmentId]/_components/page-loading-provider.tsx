'use client'

import { createContext, useContext, useState, useTransition, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

type PageLoadingContextType = {
    refreshPage: () => void
    isRefreshing: boolean
}

const PageLoadingContext = createContext<PageLoadingContextType>({
    refreshPage: () => {},
    isRefreshing: false
})

export function usePageRefresh() {
    return useContext(PageLoadingContext)
}

export function PageLoadingProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const refreshPage = useCallback(() => {
        startTransition(() => {
            router.refresh()
        })
    }, [router])

    return (
        <PageLoadingContext.Provider value={{ refreshPage, isRefreshing: isPending }}>
            {children}
            {isPending && (
                <div className="fixed inset-0 z-[99999] bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-all">
                    <div className="flex flex-col items-center gap-3 bg-white rounded-xl shadow-xl px-8 py-6 border border-gray-100">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-sm font-medium text-gray-700">Updating...</p>
                    </div>
                </div>
            )}
        </PageLoadingContext.Provider>
    )
}
