import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/auth/login",
  },
  providers: [], // Keep empty in config, add in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthRoute = nextUrl.pathname.startsWith('/auth')
      
      if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }
      
      if (!isLoggedIn) return Response.redirect(new URL('/auth/login', nextUrl))
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.adminRole = (user as any).adminRole
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.adminRole = token.adminRole as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  }
} satisfies NextAuthConfig
