import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/validators/auth";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            role: true,
            clanId: true,
            isActive: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        });

        if (!user || !user.isActive || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Update last login timestamp (non-blocking)
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.displayName ?? user.email,
          image: user.profile?.avatarUrl ?? null,
          role: user.role,
          clanId: user.clanId,
        };
      },
    }),
  ],
});
