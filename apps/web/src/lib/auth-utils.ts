import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
    const session = await auth()
    
    if (!session?.user) {
        redirect("/login")
    }

    return session.user
}

export async function requireRole(allowedRoles: string[]) {
    const user = await requireAuth()

    if (!user.role || !allowedRoles.includes(user.role)) {
        redirect("/login?message=Unauthorized access")
    }

    return user
}
