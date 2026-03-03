# RF-02 — Refactor: Self-hosted PostgreSQL → Supabase + Vercel Deployment

> **Status:** Done  
> **Priority:** High  
> **Affected modules:** `src/lib/prisma.ts`, `next.config.ts`, `package.json`, `.env.example`, `.env.local`, env config  
> **Actual scope:** 8 files modified, 2 files created (`supabase/config.toml`, `src/types/supabase.ts`), 0 files deleted

---

## 1. Motivation

- **No hosting:** The project currently runs only in local development — no production deployment exists.
- **Supabase** provides a free-tier managed PostgreSQL with built-in connection pooling (PgBouncer), Storage buckets, and optional Auth — eliminating the need to self-manage a database server.
- **Vercel** is the native deployment platform for Next.js, offering serverless functions, edge caching, preview deployments, and zero-config CI/CD.
- The existing `prisma.ts` already uses `pg.Pool` with the driver adapter pattern — migration requires only swapping the connection string.

---

## 2. Scope of Changes

### 2.1 Files to Modify

| File                | Change                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| `src/lib/prisma.ts` | Switch from `DIRECT_URL` → `DATABASE_URL` (Supabase pooler endpoint)       |
| `.env.example`      | Update connection string templates with Supabase format                    |
| `next.config.ts`    | Add `serverExternalPackages: ["bcrypt"]` + Supabase Storage image patterns |
| `package.json`      | Add `postinstall: "prisma generate"` script for Vercel builds              |

### 2.2 No Files to Create or Delete

The existing codebase structure is fully compatible with Vercel + Supabase. No new modules or refactors needed.

---

## 3. Supabase Project Setup Guide

### 3.1 Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Choose region: `Southeast Asia (Singapore)` (closest to Vietnamese users)
3. Set a strong database password — save securely
4. Note credentials from **Project Settings → Database**

### 3.2 Connection Strings

| Variable       | Mode                            | Port | Usage                                        |
| -------------- | ------------------------------- | ---- | -------------------------------------------- |
| `DATABASE_URL` | Transaction pooling (PgBouncer) | 6543 | Runtime queries via `pg.Pool` in `prisma.ts` |
| `DIRECT_URL`   | Direct connection               | 5432 | Prisma migrations & `prisma db push` only    |

```env
# Supabase Connection Pooler (Transaction Mode) — used at runtime
DATABASE_URL="postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Direct Connection — used for migrations only
DIRECT_URL="postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

> **⚠️ Important:** PgBouncer (port 6543) does NOT support DDL statements. Always use `DIRECT_URL` for `prisma migrate deploy`.

### 3.3 Run Migrations

```bash
# Set DIRECT_URL in .env.local, then:
npx prisma migrate deploy

# Seed initial data (optional)
npx tsx prisma/seed.ts
```

### 3.4 Verify in Supabase Dashboard

Check **Table Editor** for all 17 tables:
`users`, `user_profiles`, `clans`, `members`, `relationships`, `member_spouses`, `member_media`, `grave_sites`, `site_media`, `ritual_events`, `ritual_instructions`, `ritual_duties`, `duties`, `duty_logs`, `virtual_offerings`, `notifications`, `audit_logs`

---

## 4. Implementation Details

### 4.1 Update `prisma.ts`

```diff
 function createPrismaClient() {
-  // Use DIRECT_URL (plain postgres://) for a proper pool
-  const pool = new Pool({
-    connectionString: process.env.DIRECT_URL!,
-    max: 10,
-    idleTimeoutMillis: 30000,
-    connectionTimeoutMillis: 5000,
-  });
+  // Use DATABASE_URL (Supabase pooler / PgBouncer) for serverless-friendly connections.
+  // DIRECT_URL (port 5432) is reserved for migrations only.
+  const pool = new Pool({
+    connectionString: process.env.DATABASE_URL!,
+    max: 10,
+    idleTimeoutMillis: 20000,
+    connectionTimeoutMillis: 10000,
+  });
```

### 4.2 Update `next.config.ts`

```diff
 const nextConfig: NextConfig = {
-  /* config options here */
+  images: {
+    remotePatterns: [
+      {
+        protocol: "https",
+        hostname: "*.supabase.co",
+        pathname: "/storage/v1/object/public/**",
+      },
+    ],
+  },
+  serverExternalPackages: ["bcrypt"],
 };
```

### 4.3 Update `package.json`

```diff
 "scripts": {
   "dev": "next dev",
   "build": "next build",
+  "postinstall": "prisma generate",
   "start": "next start",
   "lint": "eslint"
 },
```

---

## 5. Vercel Deployment Guide

### 5.1 Connect Repository

1. Push code to **GitHub**
2. Go to [vercel.com/new](https://vercel.com/new) → Import repository
3. Vercel auto-detects **Next.js**

### 5.2 Build Settings

| Setting          | Value                               |
| ---------------- | ----------------------------------- |
| Framework Preset | Next.js                             |
| Build Command    | `npx prisma generate && next build` |
| Install Command  | `npm install`                       |
| Node.js Version  | 20.x                                |

### 5.3 Environment Variables on Vercel

| Variable                          | Environments        |
| --------------------------------- | ------------------- |
| `DATABASE_URL`                    | Production, Preview |
| `DIRECT_URL`                      | Production, Preview |
| `AUTH_SECRET`                     | Production, Preview |
| `NEXTAUTH_URL`                    | Production only     |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Production, Preview |

---

## 6. Feature Parity Checklist

| Feature            | Before (Local)             | After (Vercel + Supabase)   | Status        |
| ------------------ | -------------------------- | --------------------------- | ------------- |
| Database           | Self-hosted PostgreSQL     | Supabase managed PostgreSQL | ✅ Equivalent |
| Connection pooling | Direct `pg.Pool`           | PgBouncer via Supabase      | ✅ Better     |
| Auth               | NextAuth Credentials (JWT) | Same (no change)            | ✅ No change  |
| ORM                | Prisma v7 + driver adapter | Same (no change)            | ✅ No change  |
| File storage       | Local URLs                 | Supabase Storage (future)   | 🟡 Future     |
| Google Maps        | API key via env            | Same (no change)            | ✅ No change  |

---

## 7. Testing Plan

1. **Build test:** `npm run build` passes locally with Supabase connection strings
2. **Prisma generate:** `npx prisma generate` succeeds on Vercel
3. **Migration:** `npx prisma migrate deploy` applies all migrations to Supabase
4. **Auth flow:** Login/logout works with Supabase-hosted user data
5. **Page rendering:** All 5 routes render without errors (`/`, `/lineage`, `/map`, `/rituals`, `/duties`)
6. **API routes:** All `/api/*` endpoints return correct data
7. **Google Maps:** Map page loads with API key from Vercel env

---

## 8. Rollback Strategy

If issues arise post-deployment:

1. Revert the 4 file changes via `git revert <commit-hash>`
2. Restore `DIRECT_URL` usage in `prisma.ts`
3. Remove `postinstall` script from `package.json`
4. Point `.env.local` back to local PostgreSQL

---

## 9. Future Enhancements (Post-Launch)

| Feature                 | Description                                                                | Priority  |
| ----------------------- | -------------------------------------------------------------------------- | --------- |
| **Supabase Storage**    | Replace local file URLs with Storage buckets for avatars, media, panoramas | 🔴 High   |
| **Supabase Auth**       | Migrate from NextAuth Credentials to Supabase Auth for social logins       | 🟡 Medium |
| **Supabase RLS**        | Add Row-Level Security policies per clan/user at database level            | 🟡 Medium |
| **Supabase Realtime**   | Live updates for notifications, duty status changes                        | 🟢 Low    |
| **Edge Functions**      | Move heavy computations to Supabase Edge Functions                         | 🟢 Low    |
| **Vercel Analytics**    | Enable Web Analytics for performance monitoring                            | 🟡 Medium |
| **Preview Deployments** | Separate Supabase project for preview branches                             | 🟢 Low    |

---

## 10. Cost Analysis

| Service      | Free Tier                                              | Paid Tier       |
| ------------ | ------------------------------------------------------ | --------------- |
| **Supabase** | 500MB database, 1GB Storage, 50k auth MAUs             | $25/month (Pro) |
| **Vercel**   | 100GB bandwidth, serverless functions, preview deploys | $20/month (Pro) |

For a family genealogy app with moderate traffic, the combined free tier is sufficient for production launch.
