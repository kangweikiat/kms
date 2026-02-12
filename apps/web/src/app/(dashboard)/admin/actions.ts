'use server'

import { prisma, Role } from '@kms/database'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { mockStudents, mockClasses } from './mock-data'

export async function getDashboardStats(year: number = 2026) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Verify Role
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
    })

    if (!dbUser || dbUser.role !== Role.ADMIN) {
        redirect('/login')
    }

    // 2. Fetch Data (MOCK) & Filter by Year
    const filteredStudents = mockStudents.filter(s => (s.intakeYear || 2026) === year)

    // For classes, in a real app we'd check academic year. 
    // For mock, let's just assume active classes are for current year (2026).
    // If year is 2027, maybe show 0 active classes or some projected number.
    // Let's keep it simple: scale classes based on student ratio for now to show visual change
    const activeClasses = year === 2026 ? mockClasses.length : Math.ceil(filteredStudents.length / 15)

    const totalStudents = filteredStudents.length

    // 3. Age Distribution (MOCK Processing)
    const ageGroups = {
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        Other: 0,
    }

    const today = new Date()

    filteredStudents.forEach((student) => {
        const birthDate = new Date(student.dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        // Adjust age based on intake year difference? 
        // If viewing 2027, students will be 1 year older relative to "now".
        // But usually age distribution is "Age at start of term". 
        // Let's keep simple DOB calc for now.

        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }

        if (age >= 2 && age <= 6) {
            // @ts-ignore
            ageGroups[String(age)]++
        } else {
            ageGroups.Other++
        }
    })

    const ageDistribution = Object.entries(ageGroups).map(([age, count]) => ({
        name: `${age} Years`,
        current: count,
    })).filter(item => item.name !== 'Other Years' || item.current > 0)

    // 4. Enrollment Data (Raw for Client Filtering)
    // We pass the raw list so the client can filter by Day/Month
    const enrollments = filteredStudents.map(s => ({
        date: s.createdAt.toISOString(),
    }))

    // Calculate Month-over-Month Growth
    // For Mock Data simulation, let's assume "Today" is Feb 2026
    const mockToday = new Date()
    const currentMonth = mockToday.getMonth()
    const currentYear = mockToday.getFullYear()

    // Previous Month Logic
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const prevMonth = prevMonthDate.getMonth()
    const prevYear = prevMonthDate.getFullYear()

    let currentMonthCount = 0
    let prevMonthCount = 0

    filteredStudents.forEach(s => {
        const d = new Date(s.createdAt)
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            currentMonthCount++
        } else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear) {
            prevMonthCount++
        }
    })

    let growth = currentMonthCount - prevMonthCount
    if (growth < 0) growth = 0

    return {
        totalStudents,
        activeClasses,
        ageDistribution,
        enrollments, // Pass raw data
        growthRate: growth,
        userEmail: user.email,
        year
    }
}
