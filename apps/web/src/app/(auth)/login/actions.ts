'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma, Role } from '@kms/database'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 1. Authenticate with Supabase
    const { error } = await (await supabase).auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Invalid credentials')
    }

    // 2. Check Database Role
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user || user.role !== Role.ADMIN) {
            // 3. If not admin, sign out immediately
            await (await supabase).auth.signOut()
            return redirect('/login?message=Unauthorized access: Admin only')
        }
    } catch (err) {
        console.error('Role verification failed:', JSON.stringify(err, null, 2))
        if (err instanceof Error) {
            console.error(err.message)
            console.error(err.stack)
        }
        await (await supabase).auth.signOut()
        return redirect('/login?message=System error. Please contact a tech.')
    }

    revalidatePath('/', 'layout')
    redirect('/admin')
}
