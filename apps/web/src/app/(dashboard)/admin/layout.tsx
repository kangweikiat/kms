import { redirect } from 'next/navigation'
import { prisma } from '@kms/database'
import { Sidebar } from './_components/sidebar'
import { YearSelect } from './_components/year-select'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth-utils'
import { signOut } from '@/auth'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await requireAuth()

    const cookieStore = await cookies()
    const initialYear = Number(cookieStore.get('admin_year')?.value) || 2026

    // Fetch Academic Years for the dropdown
    // Provide all years so admins can switch to inactive/draft years to configure them
    const availableYears = await prisma.academicYear.findMany({
        orderBy: { year: 'asc' },
    })

    // If no years exist (first run), maybe seed or fallback?
    // Let's pass the raw list.

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b border-gray-200">
                    <div className="font-semibold text-gray-700 md:hidden">KMS Admin</div>
                    <div className="flex-1"></div> {/* Spacer */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-gray-900">{user.name || 'Admin User'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
                        <YearSelect initialYear={initialYear} availableYears={availableYears} />
                        <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
                        <form action={async () => {
                            'use server'
                            await signOut({ redirectTo: '/login' })
                        }}>
                            <button className="text-sm text-red-600 hover:text-red-800 font-medium">Sign Out</button>
                        </form>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
