import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@kms/database'

export default async function AdminDashboard() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Example: Fetch data using the shared Prisma client
    // Note: This requires the Postgres database to be running
    const studentCount = await prisma.student.count()
    const classCount = await prisma.class.count()

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            <p className="mb-8">Welcome, {user.email}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="/admin/students" className="block hover:shadow-md transition-shadow">
                    <div className="border p-6 rounded-lg shadow-sm bg-white h-full">
                        <h2 className="text-xl font-semibold mb-2">Students</h2>
                        <p className="text-4xl font-bold text-blue-600">{studentCount}</p>
                        <p className="text-gray-600">Total registered students</p>
                    </div>
                </a>
                <div className="border p-6 rounded-lg shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-2">Classes</h2>
                    <p className="text-4xl font-bold text-green-600">{classCount}</p>
                    <p className="text-gray-600">Active classes</p>
                </div>
                <div className="border p-6 rounded-lg shadow-sm bg-white">
                    <h2 className="text-xl font-semibold mb-2">Fees</h2>
                    <p className="text-4xl font-bold text-orange-600">-</p>
                    <p className="text-gray-600">Manage payments</p>
                </div>
            </div>
        </div>
    )
}
