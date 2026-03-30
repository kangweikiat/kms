import { auth } from "@/auth"

export default auth((req) => {
    // Basic protection: if trying to access /admin naturally NextAuth doesn't auto redirect unless configured, 
    // but we can enforce it here or let Layout handle it. We will leave it simple.
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images (public images)
         */
        '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
