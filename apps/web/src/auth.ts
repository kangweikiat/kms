import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@kms/database"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(1) })
                    .safeParse(credentials)

                if (!parsedCredentials.success) {
                    return null
                }

                const { email, password } = parsedCredentials.data

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                if (!user || !(user as any).passwordHash) {
                    return null
                }

                const passwordsMatch = await bcrypt.compare(password, (user as any).passwordHash)

                if (passwordsMatch) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    }
                }

                return null
            }
        })
    ],
})
