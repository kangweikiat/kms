'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    try {
        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo: '/admin',
        })
    } catch (error) {
        if (error instanceof AuthError) {
            let encodedMessage = encodeURIComponent('System error. Please contact a tech.')
            if (error.type === 'CredentialsSignin') {
                encodedMessage = encodeURIComponent('Invalid credentials.')
            }
            redirect(`/login?message=${encodedMessage}`)
        }
        throw error
    }
}
