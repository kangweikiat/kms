import { redirect } from 'next/navigation'
import { prisma, Role } from '@kms/database'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from './_components/sidebar'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()

    const {
        data: { user },
    } = await (await supabase).auth.getUser()

    if (!user || user.email === undefined) {
        return redirect('/login')
    }

    // Double-check role in database for every admin page request
    // This ensures even valid Supabase sessions are checked against our RBAC
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    })

    if (!dbUser || dbUser.role !== Role.ADMIN) {
        // Force signout if role is invalid
        await (await supabase).auth.signOut()
        return redirect('/login?message=Unauthorized: Admin access required')
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b border-gray-200">
                    <div className="font-semibold text-gray-700 md:hidden">KMS Admin</div>
                    <div className="flex-1"></div> {/* Spacer */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-gray-900">{dbUser.name || 'Admin User'}</p>
                            <p className="text-xs text-gray-500">{dbUser.email}</p>
                        </div>
                        <form action={async () => {
                            'use server'
                            const supabase = createClient()
                            await (await supabase).auth.signOut()
                            redirect('/login')
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
