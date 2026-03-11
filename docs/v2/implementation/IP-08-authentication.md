# IP-08: Authentication Implementation Plan (Sign In & Register)

> **Phase:** V2 — Authentication System  
> **PRD Reference:** PRD-08-authentication.md  
> **Depends on:** IP-07 (Landing Page route restructuring must be done first)  
> **Design Reference:** `v1/ui/0.1.login.html`, `v1/ui/0.2.register.html`  
> **Estimated Effort:** 1 sprint (5–7 days)

---

## Overview

Implement proper authentication flows: public registration (creating user + clan), sign in, password reset, and auth-aware redirects. Replaces the basic v1 auth setup with a production-ready system.

---

## Task 1: Database Migration — Password Reset Tokens

**ID:** `AUTH-001`  
**Output:** New Prisma model + migration

### Steps

1. Add `PasswordResetToken` model to `prisma/schema.prisma`:
   ```prisma
   model PasswordResetToken {
     id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
     userId    String    @map("user_id") @db.Uuid
     token     String    @unique @db.VarChar(255)
     expiresAt DateTime  @map("expires_at") @db.Timestamptz()
     usedAt    DateTime? @map("used_at") @db.Timestamptz()
     createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz()

     user User @relation(fields: [userId], references: [id], onDelete: Cascade)

     @@index([token])
     @@index([userId])
     @@map("password_reset_tokens")
   }
   ```

2. Add relation to `User` model:
   ```prisma
   model User {
     // ... existing fields
     passwordResetTokens PasswordResetToken[]
   }
   ```

3. Run migration:
   ```bash
   npx prisma migrate dev --name add_password_reset_tokens
   ```

### DoD
- [x] Migration runs successfully
- [x] `password_reset_tokens` table exists with correct columns
- [x] Foreign key to `users` table works

---

## Task 2: Zod Validation Schemas

**ID:** `AUTH-002`  
**Output:** `src/lib/validators/auth.ts`

### Steps

1. Create auth validation schemas:
   ```typescript
   // src/lib/validators/auth.ts
   import { z } from "zod";

   export const registerSchema = z.object({
     displayName: z.string().min(2).max(100).trim(),
     email: z.string().email().toLowerCase().trim(),
     password: z.string()
       .min(8, "Tối thiểu 8 ký tự")
       .max(128)
       .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
       .regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
     confirmPassword: z.string(),
     clanName: z.string().min(2).max(200).trim(),
   }).refine(
     (data) => data.password === data.confirmPassword,
     { message: "Mật khẩu xác nhận không khớp", path: ["confirmPassword"] }
   );

   export const signInSchema = z.object({
     email: z.string().email().toLowerCase().trim(),
     password: z.string().min(1, "Vui lòng nhập mật khẩu"),
   });

   export const forgotPasswordSchema = z.object({
     email: z.string().email().toLowerCase().trim(),
   });

   export const resetPasswordSchema = z.object({
     token: z.string().uuid(),
     password: z.string().min(8).max(128)
       .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
       .regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
     confirmPassword: z.string(),
   }).refine(
     (data) => data.password === data.confirmPassword,
     { message: "Mật khẩu xác nhận không khớp", path: ["confirmPassword"] }
   );
   ```

### DoD
- [x] All schemas validate correctly
- [x] Error messages are in Vietnamese
- [x] Schemas are importable from both client and server

---

## Task 3: Registration API Route

**ID:** `AUTH-003`  
**Output:** `src/app/api/auth/register/route.ts`

### Steps

1. Create registration endpoint:
   ```typescript
   // POST /api/auth/register
   // 1. Parse + validate body with registerSchema
   // 2. Check email uniqueness (case-insensitive)
   // 3. Hash password with bcrypt (cost 12)
   // 4. Transaction:
   //    a. Create Clan { name, display_name }
   //    b. Create User { email, password_hash, role: HEAD_OF_HOUSE, clan_id }
   //    c. Create UserProfile { user_id, display_name }
   // 5. Return success with user data (no password)
   ```

2. Use Prisma transaction to ensure atomicity:
   ```typescript
   const result = await prisma.$transaction(async (tx) => {
     const clan = await tx.clan.create({ data: { name: clanName, displayName: clanName } });
     const user = await tx.user.create({
       data: {
         email,
         passwordHash: hashedPassword,
         role: "HEAD_OF_HOUSE",
         clanId: clan.id,
       },
     });
     await tx.userProfile.create({
       data: { userId: user.id, displayName },
     });
     return { user, clan };
   });
   ```

3. Add rate limiting (simple in-memory for now, upgrade to Redis later):
   ```typescript
   // Use Map<ip, { count, resetTime }> for rate limiting
   // 5 requests per IP per 15 minutes
   ```

### DoD
- [x] `POST /api/auth/register` creates user + clan + profile atomically
- [x] Returns 409 if email exists
- [x] Returns 400 with field-specific errors
- [x] Rate limited to 5 req / 15 min per IP
- [x] Password is hashed, never returned in response

---

## Task 4: Update NextAuth Configuration

**ID:** `AUTH-004`  
**Output:** Updated `src/lib/auth.ts`

### Steps

1. Update credentials provider to use new validation:
   ```typescript
   // src/lib/auth.ts
   import { signInSchema } from "@/lib/validators/auth";

   // In authorize():
   // 1. Validate with signInSchema
   // 2. Find user with email (case-insensitive)
   // 3. Verify password with bcrypt.compare()
   // 4. Check user.isActive
   // 5. Update lastLoginAt
   // 6. Return user object for JWT
   ```

2. Configure JWT callback to include `role` and `clanId`:
   ```typescript
   callbacks: {
     jwt({ token, user }) {
       if (user) {
         token.role = user.role;
         token.clanId = user.clanId;
       }
       return token;
     },
     session({ session, token }) {
       session.user.id = token.sub;
       session.user.role = token.role;
       session.user.clanId = token.clanId;
       return session;
     },
   }
   ```

3. Configure pages:
   ```typescript
   pages: {
     signIn: "/auth/signin",
     error: "/auth/signin",   // Redirect auth errors to sign in page
   }
   ```

### DoD
- [x] Sign in works with email + password
- [x] JWT contains `role` and `clanId`
- [x] Session object has `user.role` and `user.clanId`
- [x] Inactive users cannot sign in
- [x] `lastLoginAt` updated on each sign in

---

## Task 5: Auth Page Shared Components

**ID:** `AUTH-005`  
**Output:** Shared UI for auth pages

### Files to Create

1. `src/components/auth/AuthPageLayout.tsx`
   - Split-screen layout (7/12 image | 5/12 form) matching mockup
   - Left: Background image + Heritage Cloud branding
   - Right: Imperial scroll container for form
   - Mobile: Full-screen scroll, no split
   - Lacquer pillars as decorative elements

2. `src/components/auth/ImperialScrollForm.tsx`
   - Scroll roller (top) + parchment body + scroll roller (bottom)
   - Title: "IMPERIAL DECREE" with decorative dividers
   - Subtitle prop for context ("Identity Authentication Required" etc.)
   - Children slot for form content

3. `src/components/auth/PasswordStrengthIndicator.tsx`
   - Real-time checklist:
     - ☑/☐ Tối thiểu 8 ký tự
     - ☑/☐ Ít nhất 1 chữ hoa
     - ☑/☐ Ít nhất 1 chữ số
   - Green checkmarks for met requirements

4. `src/components/auth/AuthInput.tsx`
   - Styled input with bottom-border-only design
   - Label above (uppercase, tracking-widest)
   - Error message slot below
   - Integrates with `react-hook-form` via `register` prop

### DoD
- [x] `AuthPageLayout` renders split-screen on desktop, stacked on mobile
- [x] `ImperialScrollForm` matches the HTML mockup styling
- [x] `PasswordStrengthIndicator` updates in real-time
- [x] All components use design tokens from PRD-00

---

## Task 6: Sign In Page

**ID:** `AUTH-006`  
**Output:** `src/app/auth/signin/page.tsx`

### Steps

1. Server component wrapper that checks session:
   ```tsx
   // If already signed in → redirect("/dashboard")
   ```

2. Client component `SignInForm`:
   ```tsx
   "use client";
   // - react-hook-form + signInSchema
   // - Call signIn("credentials", { email, password, redirect: false })
   // - Handle success: router.push(callbackUrl || "/dashboard")
   // - Handle error: show Vietnamese error message
   // - "Remember Me" checkbox (extends session)
   // - Link to Register + Forgot Password
   ```

3. Wrap with `AuthPageLayout` + `ImperialScrollForm`

### DoD
- [x] Form validates client-side before submit
- [x] Successful login redirects to dashboard
- [x] Wrong credentials show generic error
- [x] "Remember Me" extends session duration
- [x] Links to register and forgot password work
- [x] Authenticated users are redirected away

---

## Task 7: Register Page

**ID:** `AUTH-007`  
**Output:** `src/app/auth/register/page.tsx`

### Steps

1. Server component wrapper (redirect if authenticated)

2. Client component `RegisterForm`:
   ```tsx
   "use client";
   // - react-hook-form + registerSchema
   // - POST to /api/auth/register
   // - On success: auto signIn("credentials") then redirect
   // - On error: show field-specific errors
   // - Password strength indicator shown while typing
   // - Clan name field with helper text
   ```

3. Wrap with `AuthPageLayout` + `ImperialScrollForm`

4. Registration subtitle: "Khởi Tạo Di Sản Gia Tộc" (Initialize Clan Heritage)

### DoD
- [x] All 5 fields validate client + server side
- [x] Successful registration creates user + clan + profile
- [x] Auto-signs in after registration
- [x] Duplicate email shows specific error
- [x] Password strength indicator works in real-time
- [x] Authenticated users are redirected away

---

## Task 8: Password Reset Pages

**ID:** `AUTH-008`  
**Output:** Forgot password + Reset password pages

### Files

1. `src/app/auth/forgot-password/page.tsx`
   - Single email input form
   - Always shows success message (security: don't reveal if email exists)
   - Calls `POST /api/auth/forgot-password`

2. `src/app/api/auth/forgot-password/route.ts`
   - Validate email
   - Find user by email
   - If exists: create `PasswordResetToken` (expires in 1 hour)
   - Log reset URL to console (no email service in v2)
   - Always return 200

3. `src/app/auth/reset-password/page.tsx`
   - Reads `?token=xxx` from URL
   - Form: new password + confirm password
   - Calls `POST /api/auth/reset-password`

4. `src/app/api/auth/reset-password/route.ts`
   - Validate token exists, not expired, not used
   - Hash new password
   - Update user's password
   - Mark token as used
   - Return success

### DoD
- [x] Forgot password always returns success (timing-safe)
- [x] Reset token expires after 1 hour
- [x] Used tokens cannot be reused
- [x] Password update works correctly
- [x] Invalid/expired tokens show error

---

## Task 9: Auth Middleware (Route Protection)

**ID:** `AUTH-009`  
**Output:** `src/middleware.ts`

### Steps

1. Create Next.js middleware for route protection:
   ```typescript
   // src/middleware.ts
   import { auth } from "@/lib/auth";

   export default auth((req) => {
     const { nextUrl, auth } = req;
     const isAuthenticated = !!auth;

     // Public routes (no auth needed)
     const publicRoutes = ["/", "/auth/signin", "/auth/register",
                           "/auth/forgot-password", "/auth/reset-password"];

     // API public routes
     const publicApiRoutes = ["/api/auth"];

     if (publicRoutes.includes(nextUrl.pathname)) return;
     if (nextUrl.pathname.startsWith("/api/auth")) return;

     // Protected routes: redirect to signin
     if (!isAuthenticated) {
       const signInUrl = new URL("/auth/signin", nextUrl);
       signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
       return Response.redirect(signInUrl);
     }
   });

   export const config = {
     matcher: ["/((?!_next/static|_next/image|favicon.ico|images|site.webmanifest).*)"],
   };
   ```

### DoD
- [x] Public routes accessible without auth
- [x] Protected routes redirect to `/auth/signin`
- [x] Callback URL preserved for post-login redirect
- [x] Static assets not affected by middleware

---

## File Summary

| New / Modified File | Purpose |
|---------------------|---------|
| `prisma/schema.prisma` | Add PasswordResetToken model |
| `src/lib/validators/auth.ts` | Zod schemas for auth |
| `src/app/api/auth/register/route.ts` | Registration endpoint |
| `src/app/api/auth/forgot-password/route.ts` | Password reset request |
| `src/app/api/auth/reset-password/route.ts` | Password reset execution |
| `src/lib/auth.ts` | Updated NextAuth config |
| `src/components/auth/AuthPageLayout.tsx` | Split-screen layout |
| `src/components/auth/ImperialScrollForm.tsx` | Scroll form wrapper |
| `src/components/auth/PasswordStrengthIndicator.tsx` | Real-time password check |
| `src/components/auth/AuthInput.tsx` | Styled input component |
| `src/app/auth/signin/page.tsx` | Sign in page |
| `src/app/auth/register/page.tsx` | Registration page |
| `src/app/auth/forgot-password/page.tsx` | Forgot password page |
| `src/app/auth/reset-password/page.tsx` | Reset password page |
| `src/middleware.ts` | Route protection middleware |

---

## Dependencies

- `bcrypt` (already installed)
- `zod` (already installed)
- `react-hook-form` + `@hookform/resolvers` (already installed)
- `next-auth` (already installed)
- No new npm packages required
