# PRD-06: Heritage Cloud — Vercel + Supabase Deployment

> **Product Name:** Heritage Cloud (Gia Phả Việt)  
> **Document Type:** Product Requirements Document  
> **Last Updated:** 2026-03-01  
> **Status:** Planned  
> **Implementation Plan:** `IP-06-vercel-supabase-deployment.md`  
> **Refactor Doc:** `RF-02-vercel-supabase-deployment.md`

---

## 1. Objective

Deploy Heritage Cloud from local development to a production-ready environment using **Vercel** (hosting) and **Supabase** (managed PostgreSQL database), enabling real users to access the application online.

### 1.1 Goals

| Goal                      | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| **Production Hosting**    | Make Heritage Cloud accessible via a public URL                     |
| **Managed Database**      | Replace self-hosted PostgreSQL with Supabase's managed service      |
| **Zero Downtime Deploys** | Leverage Vercel's CI/CD for automatic deployments on git push       |
| **Scalability**           | Supabase connection pooling for serverless-friendly database access |
| **Developer Experience**  | Preview deployments for PRs, environment variable management        |

### 1.2 Non-Goals (v1)

- Supabase Auth migration (keep NextAuth)
- Supabase Storage integration (keep existing URL-based media)
- Row-Level Security policies
- Supabase Realtime subscriptions
- Edge Functions

---

## 2. Architecture

### 2.1 Current Architecture (Local Only)

```
[Browser] → [Next.js Dev Server (localhost:3000)]
                    ↓
            [pg.Pool → Direct PostgreSQL]
```

### 2.2 Target Architecture (Vercel + Supabase)

```
[Browser] → [Vercel Edge Network (CDN)]
                    ↓
            [Vercel Serverless Functions (Next.js)]
                    ↓
            [pg.Pool → Supabase PgBouncer (port 6543)]
                    ↓
            [Supabase PostgreSQL (managed)]
```

### 2.3 Connection Flow

| Context                         | Connection Path                                 | Port |
| ------------------------------- | ----------------------------------------------- | ---- |
| **Runtime** (app queries)       | App → PgBouncer (Transaction Mode) → PostgreSQL | 6543 |
| **Migrations** (schema changes) | CLI → Direct PostgreSQL connection              | 5432 |

---

## 3. Technical Requirements

### 3.1 Infrastructure Requirements

| Requirement         | Specification                                 |
| ------------------- | --------------------------------------------- |
| **Vercel Plan**     | Hobby (free) or Pro ($20/mo)                  |
| **Supabase Plan**   | Free (500MB DB) or Pro ($25/mo, 8GB DB)       |
| **Node.js Version** | 20.x                                          |
| **Region**          | Southeast Asia (Singapore) — `ap-southeast-1` |
| **Custom Domain**   | Optional — configurable via Vercel            |

### 3.2 Database Requirements

| Requirement        | Current                 | Target                                        |
| ------------------ | ----------------------- | --------------------------------------------- |
| PostgreSQL version | Any (self-hosted)       | 15.x (Supabase managed)                       |
| Connection pooling | None (direct `pg.Pool`) | PgBouncer (Transaction mode)                  |
| Max connections    | 10 (pool limit)         | 10 (pool limit) + Supabase can handle more    |
| Schema management  | Prisma Migrate          | Same                                          |
| Backup             | Manual                  | Supabase auto (daily, 7-day retention on Pro) |

### 3.3 Security Requirements

| Requirement              | Implementation                                                    |
| ------------------------ | ----------------------------------------------------------------- |
| **Secrets**              | Environment variables on Vercel — never in source code            |
| **Database access**      | Connection string with password — IP restrictions on Supabase Pro |
| **Auth tokens**          | `AUTH_SECRET` generated via `openssl rand -base64 32`             |
| **API key restrictions** | Google Maps key restricted to production domain                   |
| **HTTPS**                | Auto-provisioned by Vercel                                        |

---

## 4. Environment Variables

### 4.1 Full Variable List

| Variable                          | Type   | Description                                   | Required |
| --------------------------------- | ------ | --------------------------------------------- | -------- |
| `DATABASE_URL`                    | Server | Supabase pooler connection string (port 6543) | ✅       |
| `DIRECT_URL`                      | Server | Supabase direct connection string (port 5432) | ✅       |
| `AUTH_SECRET`                     | Server | NextAuth JWT signing secret                   | ✅       |
| `NEXTAUTH_URL`                    | Server | Production URL (e.g., `https://giapha.vn`)    | ✅       |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public | Google Maps JavaScript API key                | ✅       |

### 4.2 Environment Scoping

| Variable                          | Production  |    Preview     |     Development      |
| --------------------------------- | :---------: | :------------: | :------------------: |
| `DATABASE_URL`                    | ✅ Supabase |  ✅ Supabase   | ✅ Local or Supabase |
| `DIRECT_URL`                      |     ✅      |       ✅       |          ✅          |
| `AUTH_SECRET`                     | ✅ (unique) |  ✅ (shared)   |      ✅ (local)      |
| `NEXTAUTH_URL`                    | ✅ prod URL | ✅ preview URL |   `localhost:3000`   |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |     ✅      |       ✅       |          ✅          |

---

## 5. Code Changes Summary

Only **4 files** require modification — minimal risk, no structural changes:

### 5.1 `src/lib/prisma.ts`

- **What:** Switch connection string from `DIRECT_URL` to `DATABASE_URL`
- **Why:** Runtime queries must use PgBouncer (port 6543) for serverless compatibility
- **Risk:** Low — same `pg.Pool` pattern, only connection string changes

### 5.2 `next.config.ts`

- **What:** Add `serverExternalPackages: ["bcrypt"]` and Supabase image patterns
- **Why:** `bcrypt` is a native C++ module that must be excluded from serverless bundling. Image patterns prepare for future Supabase Storage integration.
- **Risk:** Low — additive config change

### 5.3 `package.json`

- **What:** Add `"postinstall": "prisma generate"` script
- **Why:** Vercel runs `npm install` → `postinstall` → `build`. Prisma client must be generated before the build step.
- **Risk:** None — additive script

### 5.4 `.env.example`

- **What:** Update connection string templates to Supabase format
- **Why:** Developer onboarding — new contributors need correct Supabase URL format
- **Risk:** None — documentation only

---

## 6. Deployment Workflow

### 6.1 Initial Deployment

```
1. Create Supabase project (Singapore region)
2. Copy connection strings to .env.local
3. Run: npx prisma migrate deploy
4. Run: npx tsx prisma/seed.ts (optional)
5. Push code to GitHub
6. Import project on Vercel
7. Set environment variables on Vercel
8. Deploy
9. Verify all pages and API routes
```

### 6.2 Ongoing Deployment (CI/CD)

```
Developer pushes to main branch
    ↓
Vercel auto-detects push
    ↓
npm install → postinstall (prisma generate) → next build
    ↓
Deploy to production (zero-downtime swap)
```

### 6.3 Preview Deployments

```
Developer opens Pull Request
    ↓
Vercel creates preview deployment
    ↓
Uses same Supabase database (or branch database on Pro)
    ↓
Accessible at unique preview URL
```

---

## 7. Performance Expectations

| Metric           | Local Dev        | Vercel + Supabase (Expected)        |
| ---------------- | ---------------- | ----------------------------------- |
| Cold start       | N/A              | ~500ms (serverless)                 |
| Database query   | ~5ms (localhost) | ~20-50ms (network hop to Singapore) |
| Page load (TTFB) | ~100ms           | ~200-400ms                          |
| Build time       | ~30s             | ~60-90s (Vercel)                    |
| Global CDN       | ❌               | ✅ (Vercel Edge)                    |

---

## 8. Future Enhancements Roadmap

| Phase    | Feature            | Description                                        |
| -------- | ------------------ | -------------------------------------------------- |
| **v1.1** | Supabase Storage   | Migrate media uploads to Supabase Storage buckets  |
| **v1.2** | Supabase Auth      | Add Google/Facebook social login via Supabase Auth |
| **v1.3** | Row-Level Security | Database-level access control per clan/user        |
| **v2.0** | Supabase Realtime  | Live notifications and duty status updates         |
| **v2.0** | Edge Functions     | Server-side processing close to users              |

---

## 9. Acceptance Criteria

### 9.1 Must Have (Launch Blockers)

- [ ] App accessible via Vercel URL
- [ ] All 5 main pages render correctly (`/`, `/lineage`, `/map`, `/rituals`, `/duties`)
- [ ] Authentication works (login/logout)
- [ ] API routes serve data from Supabase
- [ ] Google Maps loads on `/map` page
- [ ] HTTPS enabled
- [ ] No secrets in source code

### 9.2 Should Have

- [ ] Custom domain configured
- [ ] Preview deployments for PRs
- [ ] Vercel Analytics enabled

### 9.3 Nice to Have

- [ ] Supabase Storage for media files
- [ ] Database monitoring alerts
- [ ] Performance benchmarks documented
