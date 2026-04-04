# Heritage Cloud — Gia Phả Việt Monorepo

> **Nền tảng quản lý gia phả và di sản văn hóa gia tộc Việt Nam.**
> A Vietnamese family genealogy and ancestral heritage management platform.

**Web App:** [https://www.hotoc.io.vn](https://www.hotoc.io.vn)  
**Repository:** [github.com/harrynguyen2906/gia-pha-viet](https://github.com/harrynguyen2906/gia-pha-viet)

---

## Monorepo Overview

This repository is a **Turborepo + NPM Workspaces** monorepo containing two Next.js applications and one shared database package.

```
gia-pha/                        ← Monorepo root
├── apps/
│   ├── gia-pha-web/            ← 🌐 Public web app (hotoc.io.vn)
│   └── gia-pha-admin/          ← 🛡️  Admin dashboard (internal)
├── packages/
│   └── db/                     ← 🗄️  Shared database package (@gia-pha/db)
├── turbo.json                  ← Turborepo task pipeline
├── eslint.config.mjs           ← Root ESLint config (all packages)
├── .prettierrc.json            ← Root Prettier config (all packages)
├── .husky/pre-commit           ← Pre-commit lint + format hooks
└── package.json                ← Root workspace config
```

---

## Architecture

### Turborepo Pipeline

```mermaid
graph TD
    DB["@gia-pha/db\nschema + migrations"]
    WEB["gia-pha-web\nnext build"]
    ADMIN["gia-pha-admin\nnext build"]
    DB -->|"postinstall: prisma generate"| WEB
    DB -->|"postinstall: prisma generate"| ADMIN
```

- **`turbo run build`** — builds all packages in dependency order
- **`turbo run dev`** — starts all dev servers concurrently
- **Remote caching** enabled for CI/CD speed

### Database Architecture

The database is **PostgreSQL on Supabase** with two schemas:

| Schema   | Purpose                                                            |
| -------- | ------------------------------------------------------------------ |
| `public` | Core app data: users, clans, members, rituals, duties, grave sites |
| `admin`  | Subscription management: tiers, billing, admin users               |

**Migration source of truth:** `packages/db/prisma/schema.prisma`  
**Each app** runs its own `prisma generate` for local TypeScript type inference.

### Code Quality Pipeline

Every `git commit` triggers:

```
lint-staged → ESLint (auto-fix) → Prettier (auto-format) → commit
```

---

## Packages

### 🌐 `apps/gia-pha-web` — Heritage Web App

The main public-facing Vietnamese family genealogy platform.

| Layer         | Tech                                                  |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 16 (App Router + Turbopack)                   |
| Auth          | NextAuth v5 (Credentials + JWT)                       |
| Database      | Prisma 7 + `@prisma/adapter-pg` + Supabase PostgreSQL |
| Styling       | Tailwind CSS v4                                       |
| Maps          | Google Maps (vis.gl)                                  |
| Visualization | D3.js (genealogy tree)                                |
| Hosting       | Vercel ([hotoc.io.vn](https://www.hotoc.io.vn))       |

**Core Features:**

- 🌳 Multi-generation genealogy tree (D3.js interactive graph)
- 🗺️ Ancestral grave site mapping (Google Maps + GPS)
- 📅 Ritual & anniversary calendar (Lunar/Solar dual calendar)
- 📋 Family duty assignment & workload tracking
- 👤 Member profiles with biography, media gallery, relationships
- 🔐 Secure auth with role-based access (Admin / Head of House / Member / Guest)

→ [Full web app documentation](apps/gia-pha-web/README.md)

---

### 🛡️ `apps/gia-pha-admin` — Heritage Admin Dashboard

Internal admin dashboard for subscription and clan management.

| Layer     | Tech                                  |
| --------- | ------------------------------------- |
| Framework | Next.js 16.2 (App Router + Turbopack) |
| Auth      | Custom session-based admin auth       |
| Database  | Prisma 7 + Supabase `admin` schema    |
| Styling   | Tailwind CSS                          |
| Port      | `localhost:3001` (dev)                |

**Core Features:**

- 📊 Clan overview with member counts and subscription status
- 💳 Subscription tier management (Free / Pro / Enterprise)
- 👥 Admin user management with audit logs
- 📈 Platform-wide statistics and reporting

---

### 🗄️ `packages/db` — Shared Database Package (`@gia-pha/db`)

The **single operational hub** for all database concerns.

```
packages/db/
├── prisma/
│   ├── schema.prisma       ← MASTER schema (17 models, 2 schemas)
│   ├── migrations/         ← All migration history
│   └── seed/
│       ├── index.ts        ← Run all seeds
│       ├── seed-public.ts  ← Core data (clan, members, rituals...)
│       └── seed-admin.ts   ← Admin data (tiers, admin users)
├── src/
│   ├── client.ts           ← Singleton PrismaClient with pg adapter
│   ├── index.ts            ← Public API exports
│   └── generated/          ← Auto-generated (do not edit)
└── prisma.config.ts        ← Prisma config
```

> **Rule:** All `prisma migrate` commands run from `packages/db` only. Never from an app folder.

→ [Full db package documentation](packages/db/README.md)

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 10+
- **Git**
- **Supabase account** — [supabase.com](https://supabase.com)
- **Vercel account** — [vercel.com](https://vercel.com) (for deployment)

### 1. Clone & Install

```bash
git clone https://github.com/harrynguyen2906/gia-pha-viet.git
cd gia-pha-viet

# This installs ALL workspace dependencies + auto-generates the Prisma client
npm install
```

### 2. Configure Environment Variables

**Root level** — create `.env` (picked up by Turborepo):

```bash
cp apps/gia-pha-web/.env.example apps/gia-pha-web/.env.local
```

**Required variables for `apps/gia-pha-web/.env.local`:**

```env
# Database (Supabase PostgreSQL via pgBouncer)
DATABASE_URL="postgres://user:pass@pooler.supabase.co:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgres://user:pass@db.supabase.co:5432/postgres?sslmode=require"

# Auth (NextAuth v5)
AUTH_SECRET="<run: openssl rand -base64 32>"
AUTH_URL="https://www.hotoc.io.vn"
NEXTAUTH_URL="https://www.hotoc.io.vn"

# Supabase public keys
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Supabase server-side keys (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_JWT_SECRET="..."

# Optional
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<your-key>"
```

> ⚠️ Never commit `.env.local` — it is gitignored.

### 3. Start Development

```bash
# Start all apps concurrently (web on :3000, admin on :3001)
npm run dev

# Or start individual apps
npm run dev --workspace=gia-pha-viet
npm run dev --workspace=gia-pha-admin
```

---

## Root Scripts

Run these from the **monorepo root**:

```bash
# Development
npm run dev              # Start all apps (Turborepo parallel)
npm run build            # Build all apps for production
npm run lint             # Run ESLint across all packages (via Turbo)
npm run lint:root        # Run ESLint directly (no Turbo) — faster for spot checks
npm run format           # Run Prettier across all source files
npm run format:check     # Check formatting without writing (CI-safe)

# Database (all delegate to packages/db)
npm run db:generate      # Regenerate Prisma client from master schema
npm run db:migrate:dev   # Create a new migration (dev)
npm run db:migrate:deploy # Apply migrations to production/Supabase
npm run db:migrate:status # Check migration status
npm run db:seed          # Seed ALL data (public + admin schemas)
npm run db:seed:public   # Seed public schema only
npm run db:seed:admin    # Seed admin schema only
npm run db:studio        # Open Prisma Studio (visual DB browser)
npm run db:reset         # ⚠️ Wipe and reset DB (dev only!)
npm run db:validate      # Validate the schema file
npm run db:format        # Auto-format the schema file
```

---

## Database Workflows

### Making a Schema Change

> Always work from `packages/db`, never from an app folder.

```bash
# 1. Edit the master schema
vim packages/db/prisma/schema.prisma

# 2. Create a migration (dev)
npm run db:migrate:dev
# → Prisma prompts for a migration name, e.g. "add_member_nickname"

# 3. Regenerate the shared client
npm run db:generate

# 4. Push to production
npm run db:migrate:deploy
```

### Seeding Data

```bash
npm run db:seed           # Seed everything
npm run db:seed:public    # Seed public schema (clan, members, rituals, etc.)
npm run db:seed:admin     # Seed admin schema (subscription tiers, admin users)
```

**Default credentials after seeding:**

| App             | Email                    | Password        |
| --------------- | ------------------------ | --------------- |
| Heritage Web    | `admin@heritage.local`   | `heritage2025!` |
| Heritage Web    | `editor@heritage.local`  | `editor2025!`   |
| Admin Dashboard | `admin@heritagecloud.vn` | `admin123`      |

---

## Deployment

### Vercel (Production)

Both apps deploy automatically to Vercel on every push to `main`.

**Configure these environment variables in Vercel dashboard for each app:**

| Variable                        | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `DATABASE_URL`                  | Supabase pooler (port 6543, pgbouncer)      |
| `DIRECT_URL`                    | Supabase direct (port 5432, for migrations) |
| `AUTH_SECRET`                   | NextAuth secret (same as `.env.local`)      |
| `AUTH_URL`                      | Production domain URL                       |
| `NEXTAUTH_URL`                  | Production domain URL                       |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key                   |

**Build command** (auto-detected by Vercel via `turbo.json`):

```
turbo run build
```

**Install command** (root):

```
npm install --prefix=../..
```

---

## Code Quality

### Tooling Stack

| Tool                              | Purpose                            | Scope                              |
| --------------------------------- | ---------------------------------- | ---------------------------------- |
| **ESLint** (`@typescript-eslint`) | TypeScript linting, best practices | All packages                       |
| **Prettier**                      | Code formatting                    | All `.ts`, `.tsx`, `.json`, `.css` |
| **Husky**                         | Git hook runner                    | Pre-commit                         |
| **lint-staged**                   | Only lint files you changed        | Pre-commit                         |

### Pre-commit Hook

Every `git commit` automatically:

1. Runs **ESLint** (with `--fix`) on staged `.ts`/`.tsx` files
2. Runs **Prettier** to format staged files
3. **Blocks the commit** if unfixable errors remain

### Manual Quality Checks

```bash
npm run lint:root     # ESLint all .ts/.tsx files across apps/packages
npm run format        # Prettier format all source files
npm run format:check  # Check formatting only (exits 1 if failures — for CI)
```

---

## Monorepo Rules

| Rule                                             | Reason                                                      |
| ------------------------------------------------ | ----------------------------------------------------------- |
| ✅ Only one `package-lock.json` at root          | NPM workspaces requires this; nested lockfiles break Vercel |
| ✅ Run `prisma migrate` only from `packages/db`  | Schema is the single source of truth                        |
| ✅ Each app generates its own Prisma client      | Correct cross-package TypeScript inference                  |
| ✅ Never commit `.env`, `.env.local`             | Security — all secrets gitignored                           |
| ✅ Never manually edit `src/generated/`          | Auto-generated by Prisma                                    |
| ✅ `turbo.json` declares all env vars explicitly | Required for Turborepo remote cache build isolation         |

---

## Troubleshooting

### `lightningcss` / `@tailwindcss/oxide` not found on Vercel

**Cause:** Mac lockfile missing Linux native binaries.  
**Fix:** Linux binaries declared in `optionalDependencies` in `apps/gia-pha-web/package.json`. Run `rm -rf node_modules package-lock.json && npm install` after updating.

### Prisma `include` types resolve as `never` in TypeScript

**Cause:** Cross-package Prisma type inference breaks when using a shared client.  
**Fix:** Each app generates its own client locally via `prisma generate && next build`. Do NOT import the `PrismaClient` instance from `@gia-pha/db` in app code.

### `turbo run build` fails with `Missing packageManager field`

**Fix:** Ensure `"packageManager": "npm@X.X.X"` is set in the root `package.json`.

### SSL `P1011 TlsConnectionError` on Supabase

**Cause:** pg v8 upgrades `sslmode=require` to full certificate verification.  
**Fix:** `src/lib/prisma.ts` strips `sslmode` from the URL and sets `ssl: { rejectUnauthorized: false }` on the Pool config directly.

### `AUTH_SECRET` 500 error in production

**Cause:** Missing `AUTH_SECRET` env var in Vercel, or `NEXTAUTH_URL` pointing to localhost.  
**Fix:** Set all auth variables in Vercel dashboard and ensure `trustHost: true` in `src/lib/auth.ts`.

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally: `npm run dev`
3. Commit (pre-commit hooks will auto-lint and format): `git commit -m "feat: your feature"`
4. Push and open a Pull Request: `git push origin feature/your-feature`

---

## License

MIT

---

**Project Status:** ✅ Production Deployed — April 2026  
**Maintained by:** [@harrynguyen2906](https://github.com/harrynguyen2906)
