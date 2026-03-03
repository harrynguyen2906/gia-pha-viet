/**
 * Edge-safe Auth.js config — no Prisma, no bcrypt, no Node.js-only modules.
 * Used by src/proxy.ts (Next.js edge middleware) to check sessions without
 * importing any Node.js-exclusive dependencies.
 *
 * The full config (with Credentials provider + Prisma) lives in src/lib/auth.ts.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  // No providers here — Credentials (with bcrypt + Prisma) are added in lib/auth.ts
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.clanId = (user as any).clanId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role;
        (session.user as any).clanId = token.clanId;
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
