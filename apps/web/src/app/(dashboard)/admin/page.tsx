import { getDashboardStats } from './actions'
import { StatCard } from './_components/stat-card'
import { EnrollmentGrowthChart } from './_components/enrollment-chart'
import { AgeDistributionChart } from './_components/age-chart'

import { Users, GraduationCap, TrendingUp } from 'lucide-react'

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

import { cookies } from 'next/headers'

// ... existing imports

export default async function AdminDashboard({ searchParams }: PageProps) {
    const { year: yearParam } = await searchParams
    const cookieStore = await cookies()
    const year = Number(yearParam) || Number(cookieStore.get('admin_year')?.value) || 2026

    const stats = await getDashboardStats(year)

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">
                        Welcome back, {stats.userEmail}
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    {/* YearSelect moved to layout */}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats.totalStudents}
                    description={`Active enrollments for ${year}`}
                    icon={Users}
                />
                <StatCard
                    title="Active Classes"
                    value={stats.activeClasses}
                    description="Opened classes"
                    icon={GraduationCap}
                />
                <StatCard
                    title="Growth Rate"
                    value={`+${stats.growthRate}`}
                    description="Month-over-Month"
                    icon={TrendingUp}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Enrollment Growth - Takes up 2/3 width on large screens */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Enrollment Growth</h2>
                        <p className="text-sm text-gray-500">Cumulative students over time</p>
                    </div>
                    <EnrollmentGrowthChart data={stats.enrollments} intakeYear={year} />
                </div>

                {/* Age Distribution - Takes up 1/3 width */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Age Distribution</h2>
                        <p className="text-sm text-gray-500">Students by age group</p>
                    </div>
                    <AgeDistributionChart data={stats.ageDistribution} />
                </div>
            </div>
        </div>
    )
}
