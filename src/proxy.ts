/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Uses only the edge-safe authConfig — no Prisma, no Node.js-only modules.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = new Set([
  "/",
  "/auth/signin",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const isAuthenticated = !!(req as any).auth;

  // Allow all /api/auth/** routes (NextAuth handlers + our custom auth API)
  if (nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow public page routes
  if (PUBLIC_ROUTES.has(nextUrl.pathname)) {
    // Redirect authenticated users away from auth pages back to app
    if (isAuthenticated && nextUrl.pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Protected routes: require auth
  if (!isAuthenticated) {
    const signInUrl = new URL("/auth/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}) as any;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|site.webmanifest).*)",
  ],
};
