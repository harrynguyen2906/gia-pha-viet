# IP-01: Admin Subscription Management — Implementation Plan

> **Phase:** V1 — Admin Dashboard  
> **PRD Reference:** PRD-01-subscription-management.md  
> **Depends on:** gia-pha-web V2 (Auth, Multi-Tenancy, Database Schema)  
> **Tech Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Prisma v7, Supabase PostgreSQL  
> **Estimated Effort:** 4 sprints (4–5 weeks)

---

## Sprint Overview

```
Sprint 1              Sprint 2                Sprint 3              Sprint 4
Project Setup       → Tier Management       → User & Order Mgmt  → Renewals & Polish
& DB Schema           & Dashboard KPIs        & Order Processing    & Analytics
(1 week)              (1 week)                (1.5 weeks)           (1 week)
```

---

## Sprint 1: Project Setup & Database Schema

### Task 1.1: Initialize Admin Project (Completed)

**ID:** `ADMIN-001`  
**Output:** Bootstrapped Next.js 16 admin application

#### Steps

1. Initialize Next.js 16 project in `gia-pha-admin/`:
   ```bash
   npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --no-turbopack
   ```

2. Install dependencies:
   ```bash
   npm install prisma @prisma/client @prisma/adapter-pg pg lucide-react zustand swr
   npm install next-auth@beta zod date-fns clsx tailwind-merge recharts
   npm install -D @types/pg tsx
   ```

3. Project structure:
   ```
   gia-pha-admin/
   ├── src/
   │   ├── app/
   │   │   ├── (admin)/              # Admin layout group
   │   │   │   ├── layout.tsx        # Sidebar + header layout
   │   │   │   ├── page.tsx          # Dashboard overview
   │   │   │   ├── tiers/            # Tier management
   │   │   │   ├── users/            # User subscription management
   │   │   │   ├── orders/           # Order management
   │   │   │   ├── renewals/         # Renewal & cancellation
   │   │   │   └── settings/         # Admin settings
   │   │   ├── auth/                 # Admin login
   │   │   ├── api/                  # API routes
   │   │   ├── layout.tsx            # Root layout
   │   │   └── globals.css           # Global styles
   │   ├── components/
   │   │   ├── layout/               # Sidebar, Header, Breadcrumb
   │   │   ├── ui/                   # DataTable, Modal, Badge, Card, etc.
   │   │   ├── dashboard/            # KPI cards, charts
   │   │   ├── tiers/                # Tier-specific components
   │   │   ├── users/                # User subscription components
   │   │   ├── orders/               # Order components
   │   │   └── renewals/             # Renewal & cancellation components
   │   ├── lib/
   │   │   ├── prisma.ts             # Prisma client (service-role, no RLS)
   │   │   ├── auth.ts               # Admin auth config
   │   │   └── utils.ts              # Shared utilities
   │   ├── hooks/                    # Custom React hooks
   │   ├── store/                    # Zustand stores
   │   └── types/                    # TypeScript types
   ├── prisma/
   │   ├── schema.prisma             # Multi-schema (public + admin)
   │   └── migrations/
   ├── docs/
   ├── package.json
   └── next.config.ts
   ```

4. Configure environment variables:
   ```env
   # .env.local
   DATABASE_URL=postgresql://...          # Same Supabase DB as gia-pha-web
   DIRECT_URL=postgresql://...            # Direct connection for migrations
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3001     # Different port from gia-pha-web
   ADMIN_EMAIL=admin@heritagecloud.vn
   ADMIN_PASSWORD_HASH=...
   ```

5. Set `next.config.ts` to run on port 3001 (dev) to avoid conflict with gia-pha-web.

#### DoD
- [x] Next.js 16 app boots on `localhost:3001`
- [x] Tailwind CSS v4 configured and working
- [x] Prisma configured to connect to existing Supabase DB
- [x] Project structure matches plan

---

### Task 1.2: Database Schema — New Subscription Tables (Completed)

**ID:** `ADMIN-002`  
**Output:** Prisma migration adding subscription tables to the `admin` PostgreSQL schema

#### New Models in `schema.prisma`

```prisma
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  previewFeatures = ["driverAdapters", "multiSchema"]
}

datasource db {
  provider = "postgresql"
  schemas  = ["public", "admin"]
}

// ──────────────── Existing Enums (from gia-pha-web, public schema) ────────────────
// These enums already exist in the shared DB. They are declared here
// so Prisma can reference them in the read-only model stubs below.

enum UserRole {
  ADMIN
  HEAD_OF_HOUSE
  ELDER
  MEMBER
  GUEST

  @@schema("public")
  @@map("user_role")
}

// ──────────────── Existing Model Stubs (read-only, public schema) ────────────────
// These models map to tables in the `public` schema, managed by gia-pha-web.
// The admin app reads these via Prisma cross-schema joins but does NOT
// run migrations on them. Each stub is tagged with @@schema("public").

model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String    @unique @db.VarChar(255)
  passwordHash String?   @map("password_hash") @db.VarChar(255)
  role         UserRole  @default(GUEST)
  clanId       String?   @map("clan_id") @db.Uuid
  memberId     String?   @map("member_id") @db.Uuid
  isActive     Boolean   @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at") @db.Timestamptz()
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime  @default(now()) @map("updated_at") @db.Timestamptz()

  clan          Clan?             @relation(fields: [clanId], references: [id])
  profile       UserProfile?
  subscriptions UserSubscription[]
  orders        Order[]

  @@schema("public")
  @@map("users")
}

model UserProfile {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String  @unique @map("user_id") @db.Uuid
  displayName String  @map("display_name") @db.VarChar(100)
  avatarUrl   String? @map("avatar_url") @db.VarChar(500)
  phone       String? @db.VarChar(20)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@schema("public")
  @@map("user_profiles")
}

model Clan {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String   @db.VarChar(200)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz()

  users         User[]
  subscriptions UserSubscription[]
  orders        Order[]

  @@schema("public")
  @@map("clans")
}

// ──────────────── Subscription Enums (admin schema) ────────────────
// Every enum MUST have @@schema() in multiSchema mode.
// Without it, enums default to the first schema ("public"), which is wrong.

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
  TRIAL

  @@schema("admin")
}

enum BillingCycle {
  MONTHLY
  YEARLY

  @@schema("admin")
}

enum OrderStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED

  @@schema("admin")
}

enum CancellationType {
  END_OF_PERIOD
  IMMEDIATE

  @@schema("admin")
}

enum CancellationReason {
  TOO_EXPENSIVE
  NOT_USEFUL
  SWITCHING_PRODUCT
  TECHNICAL_ISSUES
  OTHER

  @@schema("admin")
}

enum AdminRole {
  SUPER_ADMIN
  SUPPORT

  @@schema("admin")
}

// ──────────────── Subscription Models (admin schema) ────────────────

model SubscriptionTier {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug          String   @unique @db.VarChar(50)
  nameVi        String   @map("name_vi") @db.VarChar(200)
  nameEn        String   @map("name_en") @db.VarChar(200)
  descriptionVi String?  @map("description_vi")
  descriptionEn String?  @map("description_en")
  priceMonthly  Decimal  @default(0) @map("price_monthly") @db.Decimal(15, 2)
  priceYearly   Decimal  @default(0) @map("price_yearly") @db.Decimal(15, 2)
  currency      String   @default("VND") @db.VarChar(10)
  features      Json     @default("[]")
  limits        Json     @default("{}")
  badgeColor    String?  @map("badge_color") @db.VarChar(20)
  badgeIcon     String?  @map("badge_icon") @db.VarChar(50)
  isPopular     Boolean  @default(false) @map("is_popular")
  isActive      Boolean  @default(true) @map("is_active")
  displayOrder  Int      @default(0) @map("display_order")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  subscriptions UserSubscription[]
  orders        Order[]

  @@index([isActive, displayOrder])
  @@schema("admin")
  @@map("subscription_tiers")
}

model UserSubscription {
  id                String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String             @map("user_id") @db.Uuid
  clanId            String             @map("clan_id") @db.Uuid
  tierId            String             @map("tier_id") @db.Uuid
  status            SubscriptionStatus @default(ACTIVE)
  startedAt         DateTime           @map("started_at") @db.Timestamptz()
  expiresAt         DateTime           @map("expires_at") @db.Timestamptz()
  cancelledAt       DateTime?          @map("cancelled_at") @db.Timestamptz()
  cancellationReason Text?             @map("cancellation_reason")
  autoRenew         Boolean            @default(true) @map("auto_renew")
  trialEndsAt       DateTime?          @map("trial_ends_at") @db.Timestamptz()
  createdAt         DateTime           @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt         DateTime           @updatedAt @map("updated_at") @db.Timestamptz()

  user              User               @relation(fields: [userId], references: [id])
  clan              Clan               @relation(fields: [clanId], references: [id])
  tier              SubscriptionTier   @relation(fields: [tierId], references: [id])
  cancellationRequest CancellationRequest?

  @@index([userId])
  @@index([clanId])
  @@index([tierId])
  @@index([status])
  @@index([expiresAt])
  @@schema("admin")
  @@map("user_subscriptions")
}

model Order {
  id               String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderNumber      String      @unique @map("order_number") @db.VarChar(50)
  userId           String      @map("user_id") @db.Uuid
  clanId           String      @map("clan_id") @db.Uuid
  tierId           String      @map("tier_id") @db.Uuid
  billingCycle     BillingCycle @map("billing_cycle")
  amount           Decimal     @db.Decimal(15, 2)
  currency         String      @default("VND") @db.VarChar(10)
  status           OrderStatus @default(PENDING)
  paymentMethod    String?     @map("payment_method") @db.VarChar(100)
  paymentReference String?     @map("payment_reference") @db.VarChar(255)
  paidAt           DateTime?   @map("paid_at") @db.Timestamptz()
  refundedAt       DateTime?   @map("refunded_at") @db.Timestamptz()
  refundAmount     Decimal?    @map("refund_amount") @db.Decimal(15, 2)
  notes            String?
  createdAt        DateTime    @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime    @updatedAt @map("updated_at") @db.Timestamptz()

  user             User             @relation(fields: [userId], references: [id])
  clan             Clan             @relation(fields: [clanId], references: [id])
  tier             SubscriptionTier @relation(fields: [tierId], references: [id])
  billingInfo      OrderBillingInfo?

  @@index([userId])
  @@index([clanId])
  @@index([status])
  @@index([orderNumber])
  @@index([createdAt(sort: Desc)])
  @@schema("admin")
  @@map("orders")
}

model OrderBillingInfo {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orderId      String  @unique @map("order_id") @db.Uuid
  fullName     String  @map("full_name") @db.VarChar(200)
  email        String  @db.VarChar(255)
  phone        String? @db.VarChar(20)
  addressLine1 String? @map("address_line_1") @db.VarChar(255)
  addressLine2 String? @map("address_line_2") @db.VarChar(255)
  city         String? @db.VarChar(100)
  district     String? @db.VarChar(100)
  ward         String? @db.VarChar(100)
  taxId        String? @map("tax_id") @db.VarChar(50)
  companyName  String? @map("company_name") @db.VarChar(200)

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@schema("admin")
  @@map("order_billing_info")
}

model CancellationRequest {
  id                  String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  subscriptionId      String             @unique @map("subscription_id") @db.Uuid
  cancellationType    CancellationType   @map("cancellation_type")
  cancellationReason  CancellationReason @map("cancellation_reason")
  cancellationFeedback String?           @map("cancellation_feedback")
  retentionOffered    Boolean            @default(false) @map("retention_offered")
  retentionAccepted   Boolean?           @map("retention_accepted")
  processedBy         String?            @map("processed_by") @db.Uuid
  processedAt         DateTime?          @map("processed_at") @db.Timestamptz()
  createdAt           DateTime           @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt           DateTime           @updatedAt @map("updated_at") @db.Timestamptz()

  subscription UserSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([processedAt])
  @@schema("admin")
  @@map("cancellation_requests")
}

model AdminUser {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email        String    @unique @db.VarChar(255)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  displayName  String    @map("display_name") @db.VarChar(100)
  role         AdminRole @default(SUPPORT)
  isActive     Boolean   @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at") @db.Timestamptz()
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  auditLogs    AdminAuditLog[]

  @@schema("admin")
  @@map("admin_users")
}

model AdminAuditLog {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  adminUserId String   @map("admin_user_id") @db.Uuid
  action      String   @db.VarChar(100)
  entityType  String   @map("entity_type") @db.VarChar(50)
  entityId    String   @map("entity_id") @db.Uuid
  oldValue    Json?    @map("old_value")
  newValue    Json?    @map("new_value")
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz()

  adminUser   AdminUser @relation(fields: [adminUserId], references: [id])

  @@index([adminUserId])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
  @@schema("admin")
  @@map("admin_audit_logs")
}
```

> **Note on existing model stubs:** The `User`, `UserProfile`, and `Clan` models are tagged with `@@schema("public")` — they reference tables already managed by gia-pha-web. Prisma's `multiSchema` feature handles cross-schema foreign keys automatically (e.g., `admin.user_subscriptions.user_id → public.users.id`).

> **CRITICAL — Migration Safety:** Prisma `migrate dev` generates SQL for ALL models in the schema file, including the `@@schema("public")` stubs. If run naively, it will attempt to CREATE TABLE for `users`, `user_profiles`, and `clans` which already exist, causing the migration to fail. You MUST use the safe migration workflow described below.

#### Steps

1. Create the `admin` PostgreSQL schema in Supabase:
   ```sql
   -- Run in Supabase SQL Editor BEFORE running Prisma migration
   CREATE SCHEMA IF NOT EXISTS admin;

   -- Grant schema-level access
   GRANT USAGE ON SCHEMA admin TO postgres, anon, authenticated, service_role;

   -- service_role gets full access (used by admin app)
   GRANT ALL ON ALL TABLES IN SCHEMA admin TO postgres, service_role;
   ALTER DEFAULT PRIVILEGES IN SCHEMA admin GRANT ALL ON TABLES TO postgres, service_role;

   -- authenticated role needs SELECT on subscription tables (for gia-pha-web feature gating)
   -- These grants are applied AFTER tables are created (see step 4)

   -- anon role needs SELECT on subscription_tiers only (for public pricing API)
   -- These grants are applied AFTER tables are created (see step 4)
   ```

2. Add new enums and models to `prisma/schema.prisma` with `@@schema()` annotations

3. **Safe migration workflow (handles public schema stubs):**
   ```bash
   # Step 3a: Generate migration SQL WITHOUT applying it
   npx prisma migrate dev --name add_admin_subscription_tables --create-only

   # Step 3b: MANUALLY EDIT the generated SQL file at:
   #   prisma/migrations/<timestamp>_add_admin_subscription_tables/migration.sql
   #
   # REMOVE any statements that touch the public schema:
   #   - DROP/CREATE TABLE for users, user_profiles, clans
   #   - CREATE TYPE for user_role (already exists)
   #   - Any ALTER TABLE on public schema tables
   #
   # KEEP only statements that:
   #   - CREATE TYPE for admin schema enums (subscription_status, etc.)
   #   - CREATE TABLE for admin schema tables (7 tables)
   #   - CREATE INDEX for admin schema tables
   #   - ADD CONSTRAINT for cross-schema foreign keys
   #     (e.g., ALTER TABLE admin.user_subscriptions
   #            ADD CONSTRAINT ... FOREIGN KEY (user_id)
   #            REFERENCES public.users(id))

   # Step 3c: Apply the edited migration
   npx prisma migrate dev
   ```

   > **Alternative approach (simpler but less auditable):** Use `prisma db push` which applies the schema diff without creating migration files. Good for initial setup; switch to `migrate dev` for subsequent changes.

4. Apply table-level grants for gia-pha-web access:
   ```sql
   -- Run in Supabase SQL Editor AFTER tables are created
   
   -- authenticated role: SELECT on tables gia-pha-web needs for feature gating
   GRANT SELECT ON admin.subscription_tiers TO authenticated;
   GRANT SELECT ON admin.user_subscriptions TO authenticated;

   -- anon role: SELECT on subscription_tiers only (public pricing API)
   GRANT SELECT ON admin.subscription_tiers TO anon;

   -- Future-proof: default privileges for any new admin tables
   ALTER DEFAULT PRIVILEGES IN SCHEMA admin
     GRANT SELECT ON TABLES TO authenticated;
   ```

5. Create seed script for default tiers:
   ```typescript
   // prisma/seed.ts
   // Seed 3 default tiers: Free, Premium, Enterprise
   // Seed 1 default admin user: admin@heritagecloud.vn
   ```

6. Run seed:
   ```bash
   npx tsx prisma/seed.ts
   ```

#### Migration Notes & Pitfalls

| Topic | Detail |
|-------|--------|
| **Shared `_prisma_migrations` table** | Both gia-pha-web and gia-pha-admin write to the same `public._prisma_migrations` table (Prisma default). This is fine because migration names are unique per project. However, DO NOT run `prisma migrate reset` from either project — it will drop ALL migrations (both projects). |
| **`prisma migrate dev` vs `db push`** | For the initial setup, `db push` is simpler (no migration file editing). For ongoing changes, use `migrate dev --create-only`, review the SQL, then apply. |
| **Public schema stubs are read-only** | Never add or modify fields on the `User`, `UserProfile`, or `Clan` stubs in the admin schema. These models exist solely for Prisma relation joins. Changes to these tables must come from gia-pha-web migrations only. |
| **Introspection alternative** | Instead of manually writing public schema stubs, you can run `prisma db pull` to introspect the existing database first, then add admin models on top. This ensures stubs match the actual table structure. |
| **Enum naming conflicts** | The `UserRole` enum exists in both projects. The admin schema uses `@@map("user_role")` + `@@schema("public")` to reference the existing PostgreSQL type. Do NOT define a second `UserRole` — that would create a duplicate type. |
| **Cross-schema FK performance** | Cross-schema foreign keys work identically to same-schema FKs in PostgreSQL. No performance penalty. Indexes on `user_id` and `clan_id` in admin tables ensure efficient joins. |

#### DoD
- [x] `admin` PostgreSQL schema created in Supabase
- [x] All 7 new tables created in `admin` schema (`subscription_tiers`, `user_subscriptions`, `orders`, `order_billing_info`, `cancellation_requests`, `admin_users`, `admin_audit_logs`)
- [x] Existing gia-pha-web tables in `public` schema untouched
- [x] Cross-schema foreign key constraints verified: `admin.user_subscriptions.user_id → public.users.id`, `admin.user_subscriptions.clan_id → public.clans.id`, `admin.orders.user_id → public.users.id`, `admin.orders.clan_id → public.clans.id`
- [x] Default 3 tiers seeded
- [x] Default admin user seeded
- [x] Prisma client generated successfully with all relations

---

### Task 1.3: Admin Authentication (Completed)

**ID:** `ADMIN-003`  
**Output:** Admin login page and NextAuth configuration

#### Steps

1. Configure NextAuth v5 for admin:
   ```typescript
   // src/lib/auth.ts
   // - CredentialsProvider for admin_users table
   // - JWT strategy with admin role
   // - Session includes: id, email, displayName, role (AdminRole)
   ```

2. Create admin login page:
   ```
   src/app/auth/login/page.tsx
   ```
   - Email + password form
   - Clean, professional design (not cultural/imperial)
   - Heritage Cloud Admin branding
   - Error handling for invalid credentials

3. Middleware for route protection:
   ```typescript
   // src/middleware.ts
   // Protect all routes under /(admin)
   // Redirect unauthenticated to /auth/login
   // Check AdminRole for route-specific permissions
   ```

#### DoD
- [x] Admin can log in with email/password
- [x] Invalid credentials show error message
- [x] All `/(admin)` routes redirect to login if unauthenticated
- [x] JWT contains `adminRole` claim
- [x] Session timeout after 30 minutes of inactivity

---

### Task 1.4: Admin Layout — Sidebar & Header (Completed)

**ID:** `ADMIN-004`  
**Output:** `src/app/(admin)/layout.tsx`, Sidebar and Header components

#### Steps

1. Create `AdminSidebar` component:
   ```typescript
   // src/components/layout/AdminSidebar.tsx
   // - Heritage Cloud Admin logo (top)
   // - Navigation menu items (from PRD §5.1)
   // - Active route highlighting
   // - Collapsible on tablet (icon-only mode)
   // - Admin user info + logout (bottom)
   ```

2. Create `AdminHeader` component:
   ```typescript
   // src/components/layout/AdminHeader.tsx
   // - Breadcrumb navigation
   // - Search bar (global search)
   // - Notification bell (future)
   // - Admin avatar + dropdown
   ```

3. Create shared UI components:
   ```
   src/components/ui/
   ├── Badge.tsx              # Status badges (Active, Pending, etc.)
   ├── Button.tsx             # Primary, secondary, danger variants
   ├── Card.tsx               # KPI cards, stat cards
   ├── DataTable.tsx          # Sortable, filterable, paginated table
   ├── Modal.tsx              # Confirmation and form modals
   ├── Input.tsx              # Form input with label and error
   ├── Select.tsx             # Dropdown select
   ├── DatePicker.tsx         # Date range picker
   ├── Pagination.tsx         # Table pagination controls
   ├── EmptyState.tsx         # Empty state placeholder
   └── LoadingSkeleton.tsx    # Loading skeleton for tables/cards
   ```

4. Create admin layout:
   ```tsx
   // src/app/(admin)/layout.tsx
   export default function AdminLayout({ children }) {
     return (
       <div className="admin-layout">
         <AdminSidebar />
         <div className="admin-main">
           <AdminHeader />
           <main className="admin-content">{children}</main>
         </div>
       </div>
     );
   }
   ```

#### Design Tokens (globals.css)

```css
:root {
  /* Admin color palette */
  --admin-bg: #F9FAFB;
  --admin-sidebar: #1F2937;
  --admin-sidebar-hover: #374151;
  --admin-sidebar-active: #111827;
  --admin-accent: #C5A059;        /* Heritage Gold */
  --admin-accent-light: #E5C17C;
  --admin-text: #111827;
  --admin-text-muted: #6B7280;
  --admin-border: #E5E7EB;
  --admin-card: #FFFFFF;
  --admin-success: #059669;
  --admin-warning: #D97706;
  --admin-danger: #DC2626;
  --admin-info: #2563EB;

  /* Status colors */
  --status-active: #059669;
  --status-pending: #D97706;
  --status-cancelled: #DC2626;
  --status-expired: #6B7280;
  --status-trial: #2563EB;
  --status-past-due: #EA580C;
}
```

#### DoD
- [x] Sidebar renders with all menu items from PRD
- [x] Active route is highlighted in sidebar
- [x] Sidebar collapses to icons on tablet
- [x] Header shows breadcrumb and admin user info
- [x] All shared UI components render correctly
- [x] Layout is responsive (desktop primary, tablet supported)

---

## Sprint 2: Dashboard & Tier Management

### Task 2.1: Dashboard Overview Page (Completed)

**ID:** `ADMIN-005`  
**Output:** `src/app/(admin)/page.tsx` — Dashboard with KPIs and charts

#### Steps

1. Create KPI card components:
   ```typescript
   // src/components/dashboard/KPICard.tsx
   // Props: title, value, change (%), icon, color
   // Animated count-up on mount
   ```

2. Create dashboard API routes:
   ```typescript
   // src/app/api/admin/dashboard/route.ts
   // GET → Returns:
   //   - totalUsers: count of users
   //   - activeSubscriptions: count of ACTIVE user_subscriptions
   //   - monthlyRevenue: sum of completed orders this month
   //   - churnRate: % cancellations vs active
   //   - pendingOrders: count of PENDING orders
   //   - expiringSoon: count expiring within 7 days
   ```

3. Create chart components using `recharts`:
   ```typescript
   // src/components/dashboard/RevenueChart.tsx       — Line chart
   // src/components/dashboard/TierDistribution.tsx   — Donut chart
   // src/components/dashboard/NewUsersChart.tsx       — Bar chart
   // src/components/dashboard/ChurnRateChart.tsx      — Line chart
   ```

4. Assemble dashboard page:
   ```tsx
   // 6 KPI cards (2 rows of 3)
   // 2 charts per row (Revenue + Tier Distribution, New Users + Churn Rate)
   // Recent Orders table (last 5)
   // Expiring Soon alerts
   ```

#### DoD
- [x] 6 KPI cards display with correct data
- [x] 4 charts render with sample/real data
- [x] Dashboard loads in < 2 seconds
- [x] Data refreshes on page focus (SWR revalidation)

---

### Task 2.2: Tier Management — List & CRUD (Completed)

**ID:** `ADMIN-006`  
**Output:** `src/app/(admin)/tiers/` — Complete tier management pages

#### Steps

1. Create Tier API routes:
   ```typescript
   // src/app/api/admin/tiers/route.ts
   //   GET    → List all tiers (sorted by display_order)
   //   POST   → Create new tier
   
   // src/app/api/admin/tiers/[id]/route.ts
   //   GET    → Get tier by ID
   //   PUT    → Update tier
   //   DELETE → Soft-delete (set isActive = false)
   
   // src/app/api/admin/tiers/reorder/route.ts
   //   PUT    → Update display_order for multiple tiers
   ```

2. Create Tier List page:
   ```typescript
   // src/app/(admin)/tiers/page.tsx
   // - Table: slug, name, price, status (active/inactive), actions
   // - "Create Tier" button (top right)
   // - Toggle active/inactive inline
   // - Drag-and-drop reorder (using @dnd-kit)
   // - Row click → navigates to edit page
   ```

3. Create Tier Create/Edit page:
   ```typescript
   // src/app/(admin)/tiers/create/page.tsx
   // src/app/(admin)/tiers/[id]/edit/page.tsx
   // - Form fields: slug, nameVi, nameEn, descriptions, prices
   // - Features JSONB editor:
   //   - Dynamic list of feature rows
   //   - Each row: key, label_vi, label_en, included (checkbox), limit (number)
   //   - Add/remove feature rows
   // - Limits JSONB editor:
   //   - max_members, max_media_mb, max_grave_sites, max_rituals
   // - Badge customization: color picker, icon selector
   // - Preview panel (right side) showing tier card as it would appear
   // - Form validation with Zod
   ```

4. Create Tier Preview component:
   ```typescript
   // src/components/tiers/TierCardPreview.tsx
   // Renders the tier card in the same style as the landing page pricing section
   // Updates in real-time as form values change
   ```

5. Create public pricing API (for gia-pha-web consumption):
   ```typescript
   // src/app/api/public/pricing/route.ts
   // GET → Returns active tiers ordered by display_order
   // No auth required, cacheable (1 hour)
   // Response shape matches what gia-pha-web landing page expects
   ```

#### Zod Validation Schema

```typescript
const TierSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  nameVi: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  descriptionVi: z.string().optional(),
  descriptionEn: z.string().optional(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  currency: z.string().default("VND"),
  features: z.array(z.object({
    key: z.string(),
    labelVi: z.string(),
    labelEn: z.string(),
    included: z.boolean(),
    limit: z.number().optional(),
  })),
  limits: z.object({
    maxMembers: z.number().min(0),
    maxMediaMb: z.number().min(0),
    maxGraveSites: z.number().min(0),
    maxRituals: z.number().min(0),
  }),
  badgeColor: z.string().optional(),
  badgeIcon: z.string().optional(),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
});
```

#### DoD
- [x] Tier list page shows all tiers in a table
- [x] Active/inactive toggle works inline
- [x] Create tier form validates and saves to DB
- [x] Edit tier form pre-fills existing data
- [x] Features JSONB editor allows add/remove rows
- [x] Limits editor works for all 4 limit fields
- [x] Tier card preview updates in real-time
- [x] Drag-and-drop reorder works
- [x] Public pricing API returns correct data
- [x] All mutations logged in `admin_audit_logs`

---

## Sprint 3: User Account, Subscription & Order Management

### Task 3.1: User Account & Subscription Management (Completed)

**ID:** `ADMIN-007`  
**Output:** `src/app/(admin)/users/` — User account and subscription management pages

#### Steps

1. Create User & Subscription API routes:
   ```typescript
   // src/app/api/admin/users/route.ts
   //   GET → Paginated list of ALL registered users (from `users` table)
   //         LEFT JOIN user_subscriptions to include subscription data
   //         LEFT JOIN user_profiles for display name
   //         LEFT JOIN clans for clan name
   //   Query params: page, pageSize, accountStatus, subscriptionStatus,
   //                 tierId, search, sortBy, sortDir

   // src/app/api/admin/users/[id]/route.ts
   //   GET → Full user detail: account info + profile + clan + subscription + usage stats
   //   PUT → Update subscription (change tier, extend expiry, toggle auto-renew)

   // src/app/api/admin/users/[id]/status/route.ts
   //   PUT → Toggle user account enabled/disabled (updates users.is_active)
   //   Body: { isActive: boolean, reason?: string }
   //   Logs action in admin_audit_logs

   // src/app/api/admin/users/[id]/reset-password/route.ts
   //   POST → Admin-initiated password reset
   //   Creates a password_reset_tokens record and returns the reset link
   //   Admin shares this link with the user via their support channel

   // src/app/api/admin/users/[id]/history/route.ts
   //   GET → Subscription change history from admin_audit_logs
   ```

2. Create User List page:
   ```typescript
   // src/app/(admin)/users/page.tsx
   // - DataTable columns:
   //   - User (email, display name from user_profiles)
   //   - Clan name
   //   - Account Status (Active/Disabled badge — from users.is_active)
   //   - Current Tier (badge — from user_subscriptions, or "No Subscription")
   //   - Subscription Status (color-coded badge)
   //   - Registered At (users.created_at)
   //   - Last Login (users.last_login_at)
   //   - Actions (View, Edit)
   // - Filters:
   //   - Account Status dropdown (Active, Disabled)
   //   - Subscription Status dropdown (Active, Past Due, Cancelled, Expired, Trial)
   //   - Tier dropdown (dynamic from tiers table)
   //   - Date range picker (registration date)
   //   - Search input (email, display name, clan name)
   // - Pagination (50 per page)
   // - Export CSV button
   ```

3. Create User Detail page:
   ```typescript
   // src/app/(admin)/users/[id]/page.tsx
   // Left column:
   //   - Account info card:
   //     - Email, display name (from user_profiles), role, account status
   //     - Registration date, last login timestamp
   //     - Account action buttons: Disable/Enable Account, Reset Password
   //   - Clan info card (clan name, head of house, member count)
   //   - Usage stats card:
   //     - Members: current / limit
   //     - Media: current MB / limit MB
   //     - Grave Sites: current / limit
   //     - Rituals: current / limit
   //     - Visual progress bars with over-limit warning
   // Right column:
   //   - Current subscription card (tier, status, dates, auto-renew)
   //   - Subscription action buttons: Upgrade, Downgrade, Extend, Cancel
   //   - Order history table (all orders for this user)
   //   - Admin audit log for this user (from admin_audit_logs)
   ```

4. Create Upgrade/Downgrade modal:
   ```typescript
   // src/components/users/ChangeTierModal.tsx
   // - Tier selector (dropdown of active tiers)
   // - Preview of old tier → new tier
   // - Effective date (immediate vs. next cycle)
   // - Admin notes field
   // - Confirmation step
   ```

5. Create Extend Subscription modal:
   ```typescript
   // src/components/users/ExtendSubscriptionModal.tsx
   // - Current expiry date (read-only)
   // - New expiry date (date picker, must be after current)
   // - Reason for extension
   // - Confirmation
   ```

6. Create Disable/Enable Account confirmation modal:
   ```typescript
   // src/components/users/ToggleAccountModal.tsx
   // - Shows user email and current status
   // - Reason field (required when disabling)
   // - Confirmation button
   // - On confirm: PUT /api/admin/users/[id]/status
   // - Logs action in admin_audit_logs
   ```

7. Create Admin Password Reset action:
   ```typescript
   // src/components/users/AdminResetPasswordButton.tsx
   // - Confirmation dialog: "Generate a password reset link for this user?"
   // - On confirm: POST /api/admin/users/[id]/reset-password
   // - Displays the generated reset link in a copyable text field
   // - Admin shares this link with the user via their support channel
   ```

#### DoD
- [x] User list shows ALL registered users (not just those with subscriptions)
- [x] User list loads with pagination (50/page)
- [x] All 6 filters work correctly (account status, subscription status, tier, date range, search, usage)
- [x] Search returns results matching email, display name, or clan name
- [x] Detail page shows account info, clan info, subscription info, and usage stats
- [x] Usage progress bars show correctly (with over-limit warning)
- [x] Disable/Enable account toggle works and logs in admin_audit_logs
- [x] Admin password reset generates a valid reset link
- [x] Upgrade/Downgrade modal changes tier and logs in admin_audit_logs
- [x] Extend modal updates expiry date
- [x] Order history shows on detail page
- [x] Admin audit log for the user displays on detail page
- [x] CSV export downloads correctly

---

### Task 3.2: Order Management (Completed)

**ID:** `ADMIN-008`  
**Output:** `src/app/(admin)/orders/` — Order management pages

#### Steps

1. Create Order API routes:
   ```typescript
   // src/app/api/admin/orders/route.ts
   //   GET → Paginated list with filters
   //   Query params: page, pageSize, status, paymentMethod, dateFrom, dateTo,
   //                 amountMin, amountMax, search, sortBy, sortDir

   // src/app/api/admin/orders/[id]/route.ts
   //   GET → Order detail (includes billing info, user info, tier info)
   //   PUT → Update order status (confirm payment, refund, cancel)
   //   PATCH → Add/update admin notes

   // src/app/api/admin/orders/export/route.ts
   //   GET → CSV export with same filters as list
   ```

2. Create Order List page:
   ```typescript
   // src/app/(admin)/orders/page.tsx
   // - DataTable columns:
   //   - Order Number (link to detail)
   //   - User (email, name)
   //   - Tier
   //   - Billing Cycle (Monthly/Yearly)
   //   - Amount (formatted VND)
   //   - Status (color-coded badge)
   //   - Payment Method
   //   - Created At
   //   - Actions
   // - Filters:
   //   - Status dropdown
   //   - Payment method dropdown
   //   - Date range picker
   //   - Amount range (min/max inputs)
   //   - Search input
   // - Summary row: Total orders, Total revenue (for current filter)
   // - Export CSV button
   ```

3. Create Order Detail page:
   ```typescript
   // src/app/(admin)/orders/[id]/page.tsx
   // - Order summary card:
   //   - Order number, status badge, created date
   //   - Tier purchased, billing cycle, amount
   //   - Payment method, payment reference
   //   - Paid at / Refunded at timestamps
   // - User info card (email, name, clan)
   // - Billing info card:
   //   - Full name, email, phone
   //   - Address (line1, line2, ward, district, city)
   //   - Tax ID, Company name (if enterprise)
   // - Timeline:
   //   - Order created → Payment confirmed → Subscription activated
   //   - Or: Order created → Payment failed
   //   - Or: Order created → Refunded
   // - Admin notes section (editable)
   // - Action buttons: Confirm Payment, Issue Refund, Cancel Order
   ```

4. Create Confirm Payment modal:
   ```typescript
   // src/components/orders/ConfirmPaymentModal.tsx
   // - Payment reference input (bank transfer ref, etc.)
   // - Payment method selector
   // - Confirmation date
   // - Confirm button → marks order as COMPLETED, activates subscription
   ```

5. Create Refund modal:
   ```typescript
   // src/components/orders/RefundModal.tsx
   // - Full refund vs. partial refund toggle
   // - Refund amount input (if partial)
   // - Refund reason
   // - Confirm button → marks order as REFUNDED
   ```

6. Order number generation utility:
   ```typescript
   // src/lib/order-number.ts
   // Format: HC-YYYY-NNNNN
   // Example: HC-2026-00001
   // Auto-increment per year
   ```

#### DoD
- [x] Order list loads with pagination
- [x] All 5 filters work correctly
- [x] Search returns results matching order number, email, or name
- [x] Summary row shows totals for current filter
- [x] Detail page shows all order info + billing info
- [x] Timeline renders correct order lifecycle
- [x] Confirm Payment modal activates subscription
- [x] Refund modal processes full/partial refund
- [x] Admin notes are editable and saved
- [x] CSV export works with applied filters
- [x] All mutations logged in `admin_audit_logs`

---

## Sprint 4: Renewal Management & Polish

### Task 4.1: Renewal & Cancellation Management (Completed)

**ID:** `ADMIN-009`  
**Output:** `src/app/(admin)/renewals/` — Renewal pipeline and cancellation queue

#### Steps

1. Create Renewal API routes:
   ```typescript
   // src/app/api/admin/renewals/route.ts
   //   GET → Renewal pipeline data
   //   Query params: view (upcoming_7d, upcoming_30d, past_due, at_risk, recently_renewed)

   // src/app/api/admin/renewals/calendar/route.ts
   //   GET → Calendar data (renewal dates per day for month view)
   //   Query params: month, year
   ```

2. Create Cancellation API routes:
   ```typescript
   // src/app/api/admin/cancellations/route.ts
   //   GET → List pending cancellation requests

   // src/app/api/admin/cancellations/[id]/route.ts
   //   GET → Cancellation detail
   //   PUT → Process cancellation (approve end-of-period, approve immediate, offer retention)
   
   // src/app/api/admin/cancellations/analytics/route.ts
   //   GET → Cancellation analytics (reasons breakdown, churn rate over time)
   ```

3. Create Renewal Dashboard page:
   ```typescript
   // src/app/(admin)/renewals/page.tsx
   // Top section — 4 summary cards:
   //   - Upcoming 7 days (count + total revenue)
   //   - Upcoming 30 days (count + total revenue)
   //   - Past Due (count, highlighted red)
   //   - At Risk (auto-renew off, count)
   // 
   // Tab navigation:
   //   - Tab 1: Pipeline View (table of subscriptions by renewal status)
   //   - Tab 2: Calendar View (monthly calendar with renewal dots)
   //   - Tab 3: Cancellation Queue (pending cancellation requests)
   //   - Tab 4: Analytics (charts)
   ```

4. Create Pipeline View:
   ```typescript
   // src/components/renewals/PipelineView.tsx
   // - Segmented filter: Upcoming 7d | Upcoming 30d | Past Due | At Risk | Recently Renewed
   // - DataTable columns:
   //   - User, Clan, Tier, Expires At, Auto-Renew, Days Until Expiry, Actions
   // - Actions: Extend, Send Reminder (future), View Detail
   ```

5. Create Calendar View:
   ```typescript
   // src/components/renewals/CalendarView.tsx
   // - Monthly calendar grid
   // - Each day shows count of renewals
   // - Click day → shows list of subscriptions expiring that day
   // - Color intensity based on count (heat map style)
   ```

6. Create Cancellation Queue:
   ```typescript
   // src/components/renewals/CancellationQueue.tsx
   // - Table of pending cancellation requests
   // - Columns: User, Clan, Tier, Reason, Requested At, Actions
   // - Actions: Review (opens detail modal)
   ```

7. Create Cancellation Detail modal:
   ```typescript
   // src/components/renewals/CancellationDetailModal.tsx
   // - User + subscription info
   // - Cancellation reason (badge) + feedback text
   // - Usage statistics (are they actively using the platform?)
   // - Order history summary
   // - Action buttons:
   //   a) Approve End-of-Period → subscription ends at expiresAt
   //   b) Approve Immediate → subscription ends now, optional pro-rated refund
   //   c) Offer Retention → extend grace period, mark as retention offered
   // - Admin notes field
   ```

8. Create Cancellation Analytics:
   ```typescript
   // src/components/renewals/CancellationAnalytics.tsx
   // - Pie chart: Cancellation reasons breakdown
   // - Line chart: Monthly churn rate (last 12 months)
   // - Bar chart: Cancellations per tier
   // - KPI: Average subscription lifetime
   ```

#### DoD
- [x] 4 summary cards show correct counts
- [x] Pipeline view table loads with correct data per segment
- [x] Calendar view renders monthly grid with renewal counts
- [x] Click on calendar day shows subscriptions list
- [x] Cancellation queue shows pending requests
- [x] Cancellation detail modal shows all relevant info
- [x] End-of-period cancellation works correctly
- [x] Immediate cancellation works correctly
- [x] Retention offer is tracked
- [x] Analytics charts render with correct data
- [x] All mutations logged in `admin_audit_logs`

---

### Task 4.2: Settings & Audit Log (Completed)

**ID:** `ADMIN-010`  
**Output:** `src/app/(admin)/settings/` — Admin settings page

#### Steps

1. Create Settings page with tabs:
   ```
   Tab 1: General Settings
     - Platform name
     - Default currency
     - Grace period duration (days)
     - Trial period duration (days)
   
   Tab 2: Admin Users
     - Table of admin users
     - Add/Edit/Deactivate admin users
     - Role assignment (SUPER_ADMIN vs SUPPORT)
   
   Tab 3: Audit Log (reads from admin_audit_logs table)
     - Filterable table of all admin actions
     - Columns: Admin, Action, Entity Type, Entity ID, Timestamp, Old Value, New Value
     - Filters: Admin user, action type, entity type, date range
   ```

2. Create General Settings API:
   ```typescript
   // src/app/api/admin/settings/route.ts
   // GET/PUT → Platform settings stored in a settings table or JSON config
   ```

3. Create Admin Users CRUD:
   ```typescript
   // src/app/api/admin/admin-users/route.ts
   // GET → List admin users
   // POST → Create admin user (SUPER_ADMIN only)
   
   // src/app/api/admin/admin-users/[id]/route.ts
   // PUT → Update admin user (role, active status)
   // DELETE → Deactivate admin user
   ```

#### DoD
- [x] General settings are editable and persisted
- [x] Admin users can be created and managed (SUPER_ADMIN only)
- [x] Audit log displays all admin actions from `admin_audit_logs` with filters
- [x] Role-based access: SUPPORT cannot manage admin users or modify settings

---

### Task 4.3: Cross-Repo Integration with gia-pha-web (Completed)

**ID:** `ADMIN-011`  
**Output:** Public pricing API, free-tier auto-assignment at registration, and feature gating middleware in gia-pha-web

> **Note:** This task involves changes to the **gia-pha-web** codebase, not gia-pha-admin. These are bridge tasks that connect admin-managed subscription data to the web app's user flows.

#### Steps

1. Create public pricing endpoint in gia-pha-web:
   ```typescript
   // gia-pha-web/src/app/api/public/pricing/route.ts
   // GET → Query subscription_tiers table directly (shared DB)
   // Returns: active tiers sorted by display_order
   // Response is cached (revalidate: 3600)
   ```

2. Create `PricingSection` component for gia-pha-web landing page:
   ```typescript
   // gia-pha-web/src/components/marketing/PricingSection.tsx
   // - Fetches tiers from /api/public/pricing
   // - Renders tier cards in the imperial Vietnamese design
   // - Highlights "popular" tier
   // - CTA on each card links to registration with tier pre-selected
   ```

3. Add `PricingSection` to the gia-pha landing page:
   ```tsx
   // gia-pha-web/src/app/(marketing)/giapha/page.tsx
   <HeroSection />
   <FeaturesSection />
   <PricingSection />        // ← NEW
   <HowItWorksSection />
   <SocialProofSection />
   <CTABannerSection />
   ```

4. **Free-tier auto-assignment at registration:**
   ```typescript
   // gia-pha-web/src/app/api/auth/register/route.ts
   // EXISTING: Creates User + Clan + UserProfile in a transaction
   // ADD: After creating User + Clan + UserProfile, also create a
   //      user_subscriptions record linked to the default Free tier:
   //
   //   const freeTier = await prisma.subscriptionTier.findFirst({
   //     where: { slug: 'free', isActive: true }
   //   });
   //
   //   await prisma.userSubscription.create({
   //     data: {
   //       userId: newUser.id,
   //       clanId: newClan.id,
   //       tierId: freeTier.id,
   //       status: 'ACTIVE',
   //       startedAt: new Date(),
   //       expiresAt: new Date('2099-12-31'),  // Free tier never expires
   //       autoRenew: false,                    // Not applicable for free tier
   //     }
   //   });
   //
   // This ensures every registered user has a subscription record
   // and is visible in the admin panel from day one.
   ```

5. **Feature gating middleware for gia-pha-web:**
   ```typescript
   // gia-pha-web/src/lib/subscription-limits.ts
   //
   // export async function checkSubscriptionLimit(
   //   clanId: string,
   //   limitKey: 'max_members' | 'max_media_mb' | 'max_grave_sites' | 'max_rituals'
   // ): Promise<{ allowed: boolean; current: number; limit: number; tierName: string }>
   //
   // 1. Query user_subscriptions WHERE clan_id = clanId AND status = 'ACTIVE'
   // 2. Join subscription_tiers to get limits JSONB
   // 3. Query current usage count for the clan:
   //    - max_members → COUNT(members WHERE clan_id)
   //    - max_media_mb → SUM(media size WHERE clan_id)
   //    - max_grave_sites → COUNT(grave_sites WHERE clan_id)
   //    - max_rituals → COUNT(ritual_events WHERE clan_id)
   // 4. Compare: if limit === -1 or limit === null → unlimited (allowed = true)
   // 5. Return { allowed: current < limit, current, limit, tierName }
   ```

   ```typescript
   // Usage in API routes:
   // gia-pha-web/src/app/api/members/route.ts (POST handler)
   //
   //   const check = await checkSubscriptionLimit(clanId, 'max_members');
   //   if (!check.allowed) {
   //     return NextResponse.json({
   //       error: 'SUBSCRIPTION_LIMIT_REACHED',
   //       message: `Bạn đã đạt giới hạn thành viên cho gói ${check.tierName}...`,
   //       detail: { limitKey: 'max_members', currentUsage: check.current,
   //                 tierLimit: check.limit, tierName: check.tierName,
   //                 upgradeUrl: '/pricing' }
   //     }, { status: 403 });
   //   }
   ```

6. **Add `SubscriptionTier` and `UserSubscription` to gia-pha-web Prisma schema:**

   > **WARNING — This is a significant change to gia-pha-web's Prisma config.** Enabling `multiSchema` requires annotating EVERY existing model and enum with `@@schema("public")`. Without this, Prisma treats them as belonging to the first schema listed and may attempt to recreate them in a different schema during migration.

   ```typescript
   // gia-pha-web/prisma/schema.prisma — CHANGES REQUIRED:

   // 1. Add multiSchema to previewFeatures
   generator client {
     provider        = "prisma-client"
     output          = "../src/generated/prisma"
     previewFeatures = ["driverAdapters", "multiSchema"]  // ← ADD multiSchema
   }

   // 2. Add schemas array to datasource
   datasource db {
     provider = "postgresql"
     schemas  = ["public", "admin"]  // ← ADD schemas
   }

   // 3. Add @@schema("public") to ALL existing enums:
   //    GenderType, LineageRole, UserRole, RelationshipType,
   //    SiteCondition, SiteType, DutyCategory, DutyStatus,
   //    DutyPriority, AssignedGroup, MediaType, OfferingType,
   //    NotificationType
   //    Example:
   //      enum UserRole {
   //        ADMIN
   //        ...
   //        @@schema("public")  // ← ADD
   //      }

   // 4. Add @@schema("public") to ALL existing models:
   //    User, UserProfile, Clan, Member, Relationship,
   //    MemberSpouse, MemberMedia, GraveSite, SiteMedia,
   //    RitualEvent, RitualInstruction, RitualDuty, Duty,
   //    DutyLog, VirtualOffering, Notification, AuditLog,
   //    PasswordResetToken
   //    Example:
   //      model User {
   //        ...
   //        @@schema("public")  // ← ADD
   //        @@map("users")
   //      }

   // 5. Add read-only stubs for admin schema tables:

   enum SubscriptionStatus {
     ACTIVE
     PAST_DUE
     CANCELLED
     EXPIRED
     TRIAL
     @@schema("admin")
   }

   model SubscriptionTier {
     id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
     slug         String  @unique @db.VarChar(50)
     nameVi       String  @map("name_vi") @db.VarChar(200)
     nameEn       String  @map("name_en") @db.VarChar(200)
     priceMonthly Decimal @default(0) @map("price_monthly") @db.Decimal(15, 2)
     priceYearly  Decimal @default(0) @map("price_yearly") @db.Decimal(15, 2)
     features     Json    @default("[]")
     limits       Json    @default("{}")
     isPopular    Boolean @default(false) @map("is_popular")
     isActive     Boolean @default(true) @map("is_active")
     displayOrder Int     @default(0) @map("display_order")

     subscriptions UserSubscription[]

     @@schema("admin")
     @@map("subscription_tiers")
   }

   model UserSubscription {
     id        String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
     userId    String             @map("user_id") @db.Uuid
     clanId    String             @map("clan_id") @db.Uuid
     tierId    String             @map("tier_id") @db.Uuid
     status    SubscriptionStatus @default(ACTIVE)
     expiresAt DateTime           @map("expires_at") @db.Timestamptz()

     user User             @relation(fields: [userId], references: [id])
     clan Clan             @relation(fields: [clanId], references: [id])
     tier SubscriptionTier @relation(fields: [tierId], references: [id])

     @@schema("admin")
     @@map("user_subscriptions")
   }

   // 6. Add relation arrays to existing User and Clan models:
   //    model User {
   //      ...
   //      subscriptions UserSubscription[]  // ← ADD
   //    }
   //    model Clan {
   //      ...
   //      subscriptions UserSubscription[]  // ← ADD
   //    }
   ```

   **Migration for gia-pha-web after adding multiSchema:**
   ```bash
   # Use --create-only and review the SQL carefully.
   # The migration should contain ZERO changes to public schema tables
   # (only adding @@schema annotations shouldn't change the DB).
   # It should also NOT create admin schema tables (already exist from admin migration).
   # If the generated SQL is empty — that's correct! Just apply it.
   npx prisma migrate dev --name add_multischema_support --create-only
   # Review migration.sql — remove any unintended statements
   npx prisma migrate dev
   ```

#### DoD
- [x] Public pricing API returns active tiers
- [x] gia-pha-web landing page displays pricing cards
- [x] Pricing cards match the imperial Vietnamese design language
- [x] "Popular" tier has visual emphasis
- [x] Cards link to registration with tier context
- [x] Registration creates a Free tier `user_subscriptions` record automatically
- [x] `checkSubscriptionLimit()` utility works for all 4 limit keys
- [x] API routes for members, media, grave sites, and rituals enforce limits
- [x] Limit exceeded returns HTTP 403 with structured error response
- [x] gia-pha-web Prisma schema includes subscription model stubs

---

## File Summary

### New Files (gia-pha-admin)

| File | Purpose |
|------|---------|
| `src/app/(admin)/layout.tsx` | Admin layout (sidebar + header) |
| `src/app/(admin)/page.tsx` | Dashboard overview |
| `src/app/(admin)/tiers/page.tsx` | Tier list |
| `src/app/(admin)/tiers/create/page.tsx` | Create tier form |
| `src/app/(admin)/tiers/[id]/edit/page.tsx` | Edit tier form |
| `src/app/(admin)/users/page.tsx` | User account & subscription list |
| `src/app/(admin)/users/[id]/page.tsx` | User account & subscription detail |
| `src/app/(admin)/orders/page.tsx` | Order list |
| `src/app/(admin)/orders/[id]/page.tsx` | Order detail |
| `src/app/(admin)/renewals/page.tsx` | Renewal dashboard |
| `src/app/(admin)/settings/page.tsx` | Admin settings |
| `src/app/auth/login/page.tsx` | Admin login |
| `src/app/api/admin/dashboard/route.ts` | Dashboard KPIs API |
| `src/app/api/admin/tiers/route.ts` | Tier CRUD API |
| `src/app/api/admin/tiers/[id]/route.ts` | Single tier API |
| `src/app/api/admin/tiers/reorder/route.ts` | Tier reorder API |
| `src/app/api/admin/users/route.ts` | User account & subscription list API |
| `src/app/api/admin/users/[id]/route.ts` | User account & subscription detail API |
| `src/app/api/admin/users/[id]/status/route.ts` | Toggle user account enabled/disabled |
| `src/app/api/admin/users/[id]/reset-password/route.ts` | Admin-initiated password reset |
| `src/app/api/admin/orders/route.ts` | Order list API |
| `src/app/api/admin/orders/[id]/route.ts` | Order detail API |
| `src/app/api/admin/orders/export/route.ts` | Order CSV export API |
| `src/app/api/admin/renewals/route.ts` | Renewal pipeline API |
| `src/app/api/admin/renewals/calendar/route.ts` | Renewal calendar API |
| `src/app/api/admin/cancellations/route.ts` | Cancellation queue API |
| `src/app/api/admin/cancellations/[id]/route.ts` | Cancellation detail API |
| `src/app/api/admin/cancellations/analytics/route.ts` | Churn analytics API |
| `src/app/api/admin/settings/route.ts` | Settings API |
| `src/app/api/admin/admin-users/route.ts` | Admin user CRUD API |
| `src/app/api/public/pricing/route.ts` | Public pricing API |
| `src/components/layout/AdminSidebar.tsx` | Sidebar with navigation |
| `src/components/layout/AdminHeader.tsx` | Header with breadcrumb |
| `src/components/ui/*.tsx` | Shared UI components (12+ files) |
| `src/components/dashboard/*.tsx` | KPI cards + charts |
| `src/components/tiers/*.tsx` | Tier form, preview, reorder |
| `src/components/users/*.tsx` | User detail, modals (ChangeTier, ExtendSubscription, ToggleAccount, AdminResetPassword) |
| `src/components/orders/*.tsx` | Order detail, modals |
| `src/components/renewals/*.tsx` | Pipeline, calendar, queue, analytics |
| `prisma/schema.prisma` | Database schema (7 new models in `admin` schema + 3 `public` schema stubs, multiSchema enabled) |
| `prisma/seed.ts` | Seed default tiers + admin user |

### New & Modified Files (gia-pha-web)

| File | Change |
|------|--------|
| `src/app/api/public/pricing/route.ts` | New public API endpoint |
| `src/components/marketing/PricingSection.tsx` | New pricing section component |
| `src/app/(marketing)/giapha/page.tsx` | Add PricingSection to landing page |
| `src/app/api/auth/register/route.ts` | **Modified** — add free-tier subscription auto-assignment |
| `src/lib/subscription-limits.ts` | New feature gating utility (`checkSubscriptionLimit()`) |
| `src/app/api/members/route.ts` | **Modified** — add subscription limit check on POST |
| `src/app/api/media/upload/route.ts` | **Modified** — add subscription limit check on POST |
| `src/app/api/grave-sites/route.ts` | **Modified** — add subscription limit check on POST |
| `src/app/api/ritual-events/route.ts` | **Modified** — add subscription limit check on POST |
| `prisma/schema.prisma` | **Modified** — add `multiSchema` preview feature, `schemas = ["public", "admin"]`, add `@@schema("public")` to ALL 13 existing enums and ALL 18 existing models, add `SubscriptionStatus` enum + `SubscriptionTier` / `UserSubscription` model stubs with `@@schema("admin")`, add relation arrays to `User` and `Clan` |

---

## Dependencies

### New NPM Packages (gia-pha-admin)

| Package | Purpose |
|---------|---------|
| `next` | Framework |
| `react`, `react-dom` | UI |
| `tailwindcss` | Styling |
| `prisma`, `@prisma/client`, `@prisma/adapter-pg` | ORM |
| `pg` | PostgreSQL driver |
| `next-auth` (v5 beta) | Admin authentication |
| `lucide-react` | Icons |
| `zustand` | State management |
| `swr` | Data fetching |
| `zod` | Validation |
| `date-fns` | Date utilities |
| `recharts` | Charts & analytics |
| `clsx`, `tailwind-merge` | CSS utilities |
| `bcrypt` | Password hashing |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Drag-and-drop tier reorder |

### No New Packages for gia-pha-web

All required packages already installed.

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema migration breaks gia-pha-web | High | New tables are in a separate `admin` PostgreSQL schema — zero impact on `public` schema tables. Test migration on staging first. |
| Admin service-role key exposure | High | Store in env vars, never expose to client. Restrict admin app to internal network. |
| Prisma schema divergence between admin and web | Medium | Both apps use `multiSchema` with `@@schema()` annotations. Each app owns its schema and only migrates tables in that schema. Document ownership clearly. |
| Performance of cross-tenant queries (admin) | Medium | Add proper indexes on all filter/sort columns. Paginate all list views. |
| Concurrent admin edits | Low | Use optimistic locking with `updatedAt` timestamps. |
| Free-tier record missing for existing users | Medium | Run a one-time migration script to backfill `user_subscriptions` records for any users registered before the admin system was deployed. |
| Feature gating bypass via direct DB access | Low | RLS policies on gia-pha-web side remain the primary security layer; feature gating is application-level and only blocks UI/API actions. |
