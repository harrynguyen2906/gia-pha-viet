# Heritage Cloud (Họ Nguyễn Văn)

A Vietnamese family genealogy and ancestral management platform built with **Next.js 16**, **Prisma 7**, and **Supabase**. Manage family lineage, ritual calendars, ancestral maps, and family duty assignments across generations.

**Live:** [https://www.hotoc.io.vn](https://www.hotoc.io.vn)

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Lucide React icons |
| **Backend** | Next.js API Routes, NextAuth v5 (Credentials provider + JWT) |
| **Database** | Supabase PostgreSQL with PgBouncer pooler |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` (driver adapters) |
| **Auth** | NextAuth v5, bcryptjs for password hashing |
| **CLI Tools** | Supabase CLI, Vercel CLI |
| **Deployment** | Vercel (production), GitHub Actions (CI/CD ready) |
| **Types** | TypeScript, auto-generated Supabase types |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **Git** with GitHub account access
- **Supabase account** (free tier: https://supabase.com)
- **Vercel account** (free tier: https://vercel.com) — optional for local development, required for production deployment

---

## Environment Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/harrynguyen2906/gia-pha-viet.git
cd gia-pha-viet
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

**Required variables in `.env.local`:**

```env
# Database — Supabase PostgreSQL
DATABASE_URL="postgres://user:password@pooler.supabase.co:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgres://user:password@pooler.supabase.co:5432/postgres?sslmode=require"

# Auth — NextAuth configuration
AUTH_SECRET="<strong-random-secret>"  # Generate: `openssl rand -base64 32`
AUTH_URL="https://www.hotoc.io.vn"    # Production domain
NEXTAUTH_URL="https://www.hotoc.io.vn"

# Supabase — Public keys (safe for browser)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Supabase — Server-side only (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
SUPABASE_JWT_SECRET="..."
SUPABASE_SECRET_KEY="sb_secret_..."

# Supabase CLI — For type generation
SUPABASE_ACCESS_TOKEN="sbp_..."

# Optional: Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="<your-key>"
```

> **⚠️ Security Note:** Never commit `.env.local`. All secret keys are gitignored.

---

## Local Development

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Database Management

```bash
# Run pending migrations on local/remote database
npm run db:migrate

# Seed database with demo data (Vietnamese family of 5 generations)
npm run db:seed

# Open Prisma Studio DB GUI (localhost:5555)
npm run db:studio

# Generate TypeScript types from Supabase schema
npm run db:types
```

### Supabase CLI Commands

```bash
# Start local Supabase emulator (Docker required)
npm run supabase:start

# Check Supabase status / project link
npm run supabase:status
```

---

## Project Structure

```
src/
├── app/                           # Next.js App Router pages
│   ├── layout.tsx                 # Root layout with global styles
│   ├── page.tsx                   # Homepage
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth routes
│   │   └── v1/                    # REST API endpoints
│   ├── auth/                      # Auth pages (signin)
│   ├── lineage/                   # Genealogy tree & member profiles
│   ├── duties/                    # Family duty management
│   ├── map/                       # Ancestral map & grave sites
│   └── rituals/                   # Ritual calendar & events
├── components/                    # React components (organized by feature)
├── lib/                          # Utilities & configuration
│   ├── auth.ts                   # NextAuth config + JWT callbacks
│   ├── prisma.ts                 # Prisma singleton + SSL fix
│   ├── api.ts                    # API client helpers
│   └── utils.ts                  # General utilities
├── types/                        # TypeScript types
│   ├── supabase.ts              # Auto-generated Supabase types (1100+ lines)
│   └── index.ts                 # App-specific types
└── store/                        # Zustand state stores
    ├── lineageStore.ts
    ├── dutyStore.ts
    └── uiStore.ts

prisma/
├── schema.prisma                # Database schema (17 tables)
├── seed.ts                      # Initial data seeding script
└── migrations/                  # Prisma migration files

supabase/                        # Supabase CLI config & local setup
└── config.toml
```

---

## Database Schema

**17 Core Tables:**
- `User` — Family members with credentials
- `Member` — Extended genealogical info (generation, relationships)
- `Clan` — Family group metadata
- `Relationship` — Kinship connections (parent-child, spouse, sibling)
- `Ritual` — Ancestor events (birthdays, death anniversaries, holidays)
- `Site` — Grave sites & shrines with GPS coordinates
- `Duty` — Family responsibilities & task assignments
- `Spouse` — Spouse relationship data
- `_prisma_migrations` — Prisma internal tracking

See [docs/db-design/database-schema.md](docs/db-design/database-schema.md) for full schema documentation.

---

## Features

✅ **Genealogy Management**
- Multi-generation family tree visualization
- Member profiles with ancestral info
- Kinship relationship tracking

✅ **Ancestral Maps**
- Interactive Google Maps integration (configurable)
- Grave site locations with coordinates
- Cemetery boundary mapping

✅ **Ritual Calendar**
- Annual ancestor birthdays & death anniversaries
- Family ceremonies & events
- Status tracking (pending, certified, completed)

✅ **Duty Management**
- Family task assignments
- Workload distribution across members
- Completion verification & statistics

✅ **Authentication**
- Secure credential-based login (bcrypt hashing)
- JWT session tokens
- Cookie-based authentication
- Role-based access control (admin, editor, viewer)

✅ **Responsive Design**
- Mobile-first UI
- Tailwind CSS styling
- Accessible components

---

## Deployment

### Production Deploy to Vercel

#### Prerequisites
- GitHub account with repo access
- Vercel account linked to GitHub organization
- All production env vars set in Vercel (see section below)

#### Deploy Steps

**Option A: Push to GitHub (Automatic)**
```bash
git add .
git commit -m "feat: update feature"
git push origin main
# Vercel auto-deploys on every push
```

**Option B: Manual Vercel Deploy**
```bash
npm run vercel:deploy
# Deploys to: https://www.hotoc.io.vn (aliased to production URL)
```

#### Vercel Environment Variables

Set these 8 variables in Vercel dashboard (`Settings → Environment Variables → Production`):

1. **`DATABASE_URL`** — Supabase connection pooler (port 6543 with pgbouncer)
2. **`DIRECT_URL`** — Supabase direct connection (port 5432 for migrations)
3. **`AUTH_SECRET`** — Strong random secret (same as local `.env.local`)
4. **`AUTH_URL`** — `https://www.hotoc.io.vn`
5. **`NEXTAUTH_URL`** — `https://www.hotoc.io.vn` (required for custom domain)
6. **`NEXT_PUBLIC_SUPABASE_URL`** — Your Supabase project URL
7. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — Supabase anonymous public key
8. **`SUPABASE_SERVICE_ROLE_KEY`** — Supabase service role key (server-side use only)

> ⚠️ Remove any `data_`-prefixed variables that may have been auto-created by Supabase integration — they cause conflicts.

#### Custom Domain Setup

Domain configured: **www.hotoc.io.vn**
- DNS CNAME: `cname.vercel-dns.com`
- SSL: Auto-provisioned by Vercel
- Verified custom domain in Vercel dashboard

---

## Common Commands

```bash
# Development
npm run dev                    # Start Next.js dev server (port 3000)
npm run build                 # Build for production
npm start                     # Start production server

# Linting & Formatting
npm run lint                  # Run ESLint

# Database
npm run db:migrate            # Apply pending Prisma migrations
npm run db:seed              # Seed initial demo data
npm run db:studio            # Open Prisma Studio GUI
npm run db:types             # Generate Supabase TypeScript types

# Supabase
npm run supabase:start       # Start local Supabase (Docker required)
npm run supabase:status      # Check Supabase project status

# Vercel
npm run vercel:login         # Authenticate with Vercel CLI
npm run vercel:link          # Link project to Vercel
npm run vercel:deploy        # Deploy prod build to Vercel
```

---

## Troubleshooting

### SSL/TLS Connection Error (P1011)
**Symptom:** `Error: P1011 Error querying the database: db error: driver error (query error) TlsConnectionError`

**Cause:** pg v8 treats `sslmode=require` as `verify-full`, breaking the SSL config.

**Solution:** Connection strings in `DATABASE_URL` and `DIRECT_URL` have `sslmode=require` stripped by `src/lib/prisma.ts` and `prisma/seed.ts`, then SSL is set via `ssl: { rejectUnauthorized: false }` on the Pool config.

### Auth Returns 500 on All Routes
**Symptom:** `/api/auth/session`, `/api/auth/providers`, `/api/auth/error` all return 500 in production

**Root Causes:**
1. Missing `AUTH_SECRET` in Vercel
2. `NEXTAUTH_URL` points to localhost instead of production domain
3. Missing `trustHost: true` in NextAuth config for custom domains

**Solution:** All fixed in `src/lib/auth.ts` — `trustHost: true` is enabled, and production env vars point to `https://www.hotoc.io.vn`.

### GitHub Push Authentication Fails
**Symptom:** `fatal: repository 'https://github.com/harrynguyen2906/gia-pha-viet.git/' not found`

**Solution:** Use GitHub PAT (Personal Access Token) instead of password:
1. Create PAT at [https://github.com/settings/tokens](https://github.com/settings/tokens) (select `repo` scope)
2. Set username + token in remote URL:
   ```bash
   git remote set-url origin https://USERNAME:TOKEN@github.com/USERNAME/repo.git
   git push origin main
   ```

---

## Documentation

Comprehensive implementation guides and architecture docs:

- [Project Summary](docs/project-summary.md) — Overview of all features & phases
- [Database Schema](docs/db-design/database-schema.md) — Full ER diagram & table specs
- [Tech Architecture](docs/implementation/tech-architecture.md) — System design & data flow
- [API Design](docs/implementation/api-design.md) — REST endpoint documentation
- [PRD Feature Specs](docs/prd/) — Product requirements for each feature
- [Implementation Plans](docs/implementation/) — Detailed build guides

---

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes & test locally: `npm run dev`
3. Commit with descriptive message: `git commit -m "feat: add new feature"`
4. Push to GitHub: `git push origin feature/your-feature`
5. Open Pull Request for review

---

## License

MIT

---

## Support

For issues or questions:
- Check [docs/](docs/) for detailed documentation
- Review [GitHub Issues](https://github.com/harrynguyen2906/gia-pha-viet/issues)
- Contact: harrynguyen2906@github.com

**Project Status:** ✅ Production Deployed (March 2026)
