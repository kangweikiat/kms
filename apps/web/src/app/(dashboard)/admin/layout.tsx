import { redirect } from 'next/navigation'
import { prisma, Role } from '@kms/database'
import { createClient } from '@/lib/supabase/server'

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
            {/* Sidebar could go here */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white shadow-sm">
                    <div className="font-semibold text-gray-700">KMS Admin</div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{dbUser.name || dbUser.email}</span>
                        <form action={async () => {
                            'use server'
                            const supabase = createClient()
                            await (await supabase).auth.signOut()
                            redirect('/login')
                        }}>
                            <button className="text-sm text-red-600 hover:text-red-800">Sign Out</button>
                        </form>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    {children}
                </main>
            </div>
        </div>
    )
}
