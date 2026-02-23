'use server'

import { cookies } from 'next/headers'

export async function setYearCookie(year: number) {
    const cookieStore = await cookies()
    cookieStore.set('admin_year', year.toString(), {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
    })
}
