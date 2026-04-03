import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "@/auth.config"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data

          const adminUser = await prisma.adminUser.findUnique({
            where: { email },
          })

          if (!adminUser) return null
          if (!adminUser.isActive) return null

          const passwordsMatch = await bcrypt.compare(password, adminUser.passwordHash)

          if (passwordsMatch) {
            await prisma.adminAuditLog.create({
              data: {
                adminUserId: adminUser.id,
                action: "LOGIN",
                entityType: "AUTH",
                entityId: adminUser.id,
              }
            })

            await prisma.adminUser.update({
              where: { id: adminUser.id },
              data: { lastLoginAt: new Date() }
            })

            return {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.displayName,
              adminRole: adminUser.role,
            }
          }
        }
        return null
      }
    })
  ]
})
