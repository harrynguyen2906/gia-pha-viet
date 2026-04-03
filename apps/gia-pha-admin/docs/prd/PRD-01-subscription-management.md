# PRD-01: Heritage Cloud Admin — Subscription Management System

> **Version:** 1.0  
> **Module:** Admin Dashboard — Subscription Management  
> **Status:** Draft  
> **Created:** 2026-03-25  
> **Dependencies:** gia-pha-web V2 (Auth, Multi-Tenancy), Supabase PostgreSQL  
> **Related:** PRD-07 (Landing Page — Pricing Section), PRD-08 (Authentication)

---

## 1. Overview & Purpose

### 1.1 Problem Statement

Heritage Cloud (Gia Phả Việt) currently operates as a free, multi-tenant SaaS platform with no monetization layer. As the platform grows, there is a need to:

- Introduce **subscription tiers** (Free, Premium, Enterprise) that gate features and usage limits
- Manage **subscription lifecycle** — from purchase, activation, renewal, to cancellation
- Provide a **centralized admin dashboard** for the platform operator to oversee all subscriptions, users, orders, and revenue

Without an admin panel, the platform operator has no visibility into user tiers, payment status, or subscription health, and must manually query the database for any operational insight.

### 1.2 Solution

Build a **standalone admin web application** (`gia-pha-admin`) that provides:

1. **Subscription Tier Management** — CRUD operations on tiers displayed on the public landing page's pricing section
2. **User & Subscription Management** — View all registered users, manage accounts, and oversee subscription status (free tier vs. paid)
3. **Order Management** — Track all purchase orders with user-provided billing info
4. **Renewal & Cancellation Management** — Monitor upcoming renewals, process cancellations, and handle grace periods

### 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| Admin can manage tiers without DB access | 100% via UI |
| Order lookup time | < 3 seconds |
| Subscription status visibility | Real-time dashboard |
| Cancellation processing | < 2 clicks from order view |
| Data accuracy (sync with gia-pha-web) | 100% — shared DB |

---

## 2. User Personas

| Persona | Role | Needs |
|---------|------|-------|
| **Platform Admin** | Super admin of Heritage Cloud | Full CRUD on tiers, view all users/orders, process cancellations, view analytics |
| **Support Staff** | Customer support | Search users, view subscription status, view order details, initiate cancellations |

> **Note:** This admin panel is **internal-only** — not exposed to end users (clan heads, members, guests).

---

## 3. Core Modules

### 3.1 Module 1: Subscription Tier Management

**Purpose:** Define and manage the subscription plans (tiers) that are displayed on the gia-pha-web landing page pricing section and available for purchase in the gia-pha-app.

#### 3.1.1 Tier Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `slug` | String | URL-friendly identifier (e.g., `free`, `premium`, `enterprise`) |
| `name_vi` | String | Vietnamese display name (e.g., "Miễn Phí", "Cao Cấp", "Doanh Nghiệp") |
| `name_en` | String | English display name (e.g., "Free", "Premium", "Enterprise") |
| `description_vi` | Text | Vietnamese description |
| `description_en` | Text | English description |
| `price_monthly` | Decimal | Monthly price in VND (0 for free tier) |
| `price_yearly` | Decimal | Yearly price in VND (0 for free tier) |
| `currency` | String | Currency code (default: `VND`) |
| `features` | JSONB | Array of feature objects: `{ key, label_vi, label_en, included: boolean, limit?: number }` |
| `limits` | JSONB | Usage limits: `{ max_members, max_media_mb, max_grave_sites, max_rituals }` |
| `badge_color` | String | Hex color for the tier badge (e.g., `#C5A059` for gold) |
| `badge_icon` | String | Lucide icon name for tier badge |
| `is_popular` | Boolean | Show "Phổ biến nhất" badge on landing page |
| `is_active` | Boolean | Whether tier is currently available for purchase |
| `display_order` | Int | Sort order on pricing page |
| `created_at` | Timestamp | Creation timestamp |
| `updated_at` | Timestamp | Last update timestamp |

#### 3.1.2 Default Tiers

| Tier | Members | Media Storage | Grave Sites | Ritual Events | Price |
|------|---------|---------------|-------------|---------------|-------|
| **Miễn Phí** (Free) | 30 members | 100 MB | 5 | 10 | 0 VND |
| **Cao Cấp** (Premium) | 200 members | 2 GB | 50 | Unlimited | 99,000 VND/month |
| **Doanh Nghiệp** (Enterprise) | Unlimited | 20 GB | Unlimited | Unlimited | 299,000 VND/month |

#### 3.1.3 Admin UI — Tier Management

| Screen | Features |
|--------|----------|
| **Tier List** | Table view of all tiers, sortable by display_order, with status toggle (active/inactive) |
| **Tier Create/Edit** | Form with all tier fields, JSONB editor for features & limits, preview of how it renders on landing page |
| **Tier Preview** | Live preview of how the tier card will appear on the public pricing section |
| **Tier Reorder** | Drag-and-drop to reorder tiers on the pricing page |

#### 3.1.4 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| TM-01 | Admin | Create a new subscription tier | I can offer new pricing options |
| TM-02 | Admin | Edit an existing tier's pricing and features | I can adjust offerings based on market feedback |
| TM-03 | Admin | Toggle a tier active/inactive | I can soft-launch or retire tiers without deleting data |
| TM-04 | Admin | Reorder tiers on the pricing page | I can emphasize the most valuable plan |
| TM-05 | Admin | Preview how a tier renders on the landing page | I can verify visual accuracy before publishing |
| TM-06 | Admin | Set a tier as "popular" | The landing page highlights the best-value plan |

---

### 3.2 Module 2: User & Subscription Management

**Purpose:** Provide a unified view of all registered users on the platform — their account status, clan membership, and subscription lifecycle. This module covers both **user account management** (enable/disable accounts, view profiles) and **subscription management** (tier assignments, upgrades, grace periods).

> **Important — Free Tier Auto-Assignment:** Every user who registers on gia-pha-web MUST have a corresponding `user_subscriptions` record. The registration flow in gia-pha-web automatically creates a Free tier subscription when a new user account is created (along with User + Clan + UserProfile). This ensures every user is visible in the admin panel from the moment they register.

#### 3.2.1 User Subscription Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `users.id` |
| `clan_id` | UUID | FK → `clans.id` |
| `tier_id` | UUID | FK → `subscription_tiers.id` |
| `status` | Enum | `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`, `TRIAL` |
| `started_at` | Timestamp | Subscription start date |
| `expires_at` | Timestamp | Current period end date |
| `cancelled_at` | Timestamp? | When user/admin cancelled |
| `cancellation_reason` | Text? | Reason for cancellation |
| `auto_renew` | Boolean | Whether subscription auto-renews |
| `trial_ends_at` | Timestamp? | Trial expiration date (if applicable) |
| `created_at` | Timestamp | Record creation |
| `updated_at` | Timestamp | Last update |

#### 3.2.2 Admin UI — User & Subscription Management

| Screen | Features |
|--------|----------|
| **User List** | Paginated table of ALL registered users. Each row shows: email, display name, clan name, current tier (badge), subscription status, account status (active/disabled), registration date, last login. Users without a subscription record appear with a "No Subscription" indicator. |
| **User Detail** | Comprehensive user view with two sections: (1) **Account Info** — email, display name, role, clan, registration date, last login, account active/disabled status; (2) **Subscription Info** — current tier, status, dates, auto-renew, usage stats (members count, media storage, grave sites, rituals vs. tier limits with progress bars and over-limit warnings) |
| **User Account Actions** | Admin can: toggle account enabled/disabled (`users.is_active`), initiate an admin password reset (generates a reset token and provides the reset link to share with the user) |
| **Upgrade/Downgrade** | Admin can manually change a user's tier (with audit log entry) |
| **Grace Period Extension** | Admin can extend expiration date for at-risk users |

#### 3.2.3 Filters & Search

| Filter | Options |
|--------|---------|
| **Account Status** | Active, Disabled |
| **Subscription Status** | Active, Past Due, Cancelled, Expired, Trial |
| **Tier** | Free, Premium, Enterprise (dynamic from tiers table) |
| **Date Range** | Registration date range |
| **Search** | By user email, display name, or clan name |
| **Usage** | Over-limit users (exceeding tier limits) |

#### 3.2.4 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-01 | Admin | View all registered users in a table (regardless of subscription status) | I have full visibility into the user base |
| US-02 | Admin | Filter users by tier, subscription status, and account status | I can quickly find specific user segments |
| US-03 | Admin | Search users by email, display name, or clan name | I can locate a specific user for support |
| US-04 | Admin | View a user's full detail page (account info + subscription + usage) | I can see their complete profile and subscription history |
| US-05 | Admin | Manually upgrade/downgrade a user's tier | I can handle special cases (e.g., partnerships, promotions) |
| US-06 | Admin | Extend a user's subscription expiration | I can retain at-risk users with grace periods |
| US-07 | Support | View which users are over their tier limits | I can proactively reach out to upsell or assist |
| US-08 | Admin | Disable or re-enable a user's account | I can handle abuse, fraud, or support escalations |
| US-09 | Admin | Initiate a password reset for a user | I can help users who are locked out of their accounts |
| US-10 | Admin | See a user's registration date and last login time | I can assess user engagement and account activity |

---

### 3.3 Module 3: Order Management

**Purpose:** Track all purchase transactions, including user-provided billing information, payment status, and order history.

#### 3.3.1 Order Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `order_number` | String | Human-readable order ID (e.g., `HC-2026-00001`) |
| `user_id` | UUID | FK → `users.id` |
| `clan_id` | UUID | FK → `clans.id` |
| `tier_id` | UUID | FK → `subscription_tiers.id` |
| `billing_cycle` | Enum | `MONTHLY`, `YEARLY` |
| `amount` | Decimal | Total amount charged |
| `currency` | String | Currency code (`VND`) |
| `status` | Enum | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`, `CANCELLED` |
| `payment_method` | String? | Payment method label (e.g., "Bank Transfer", "MoMo", "ZaloPay") |
| `payment_reference` | String? | External payment reference/transaction ID |
| `paid_at` | Timestamp? | When payment was confirmed |
| `refunded_at` | Timestamp? | When refund was processed |
| `refund_amount` | Decimal? | Partial or full refund amount |
| `notes` | Text? | Admin notes on the order |
| `created_at` | Timestamp | Order creation timestamp |
| `updated_at` | Timestamp | Last update |

#### 3.3.2 Billing Info Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | UUID | FK → `orders.id` |
| `full_name` | String | Billing name |
| `email` | String | Billing email |
| `phone` | String? | Contact phone |
| `address_line1` | String? | Street address |
| `address_line2` | String? | Apt/suite/ward |
| `city` | String? | City/province |
| `district` | String? | District (quận/huyện) |
| `ward` | String? | Ward (phường/xã) |
| `tax_id` | String? | Tax ID / MST for enterprise invoicing |
| `company_name` | String? | Company name (for enterprise tier) |

#### 3.3.3 Admin UI — Order Management

| Screen | Features |
|--------|----------|
| **Order List** | Paginated table with all orders, sortable by date/amount/status |
| **Order Detail** | Full order breakdown: user info, tier purchased, billing info, payment status, timeline |
| **Order Status Update** | Admin can mark as completed (confirm payment), refund, or cancel |
| **Invoice Generation** | Generate PDF invoice for enterprise orders (future enhancement) |
| **Order Export** | Export filtered orders as CSV for accounting |

#### 3.3.4 Filters & Search

| Filter | Options |
|--------|---------|
| **Order Status** | Pending, Completed, Failed, Refunded, Cancelled |
| **Payment Method** | Bank Transfer, MoMo, ZaloPay, etc. |
| **Date Range** | Order creation date range |
| **Amount Range** | Min/max amount filter |
| **Search** | By order number, user email, user name |

#### 3.3.5 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| OM-01 | Admin | View all orders in a filterable table | I have full visibility into revenue |
| OM-02 | Admin | Search orders by order number or user email | I can quickly resolve support tickets |
| OM-03 | Admin | View detailed order info including billing details | I can verify payment and contact the user |
| OM-04 | Admin | Confirm a pending payment manually | I can process bank transfers that don't auto-confirm |
| OM-05 | Admin | Issue a full or partial refund | I can handle refund requests |
| OM-06 | Admin | Add notes to an order | I can document support interactions |
| OM-07 | Admin | Export orders as CSV | I can share data with accounting |

---

### 3.4 Module 4: Renewal & Cancellation Management

**Purpose:** Monitor upcoming subscription renewals, handle cancellation requests, and manage grace periods for expired subscriptions.

#### 3.4.1 Renewal Tracking

The admin dashboard provides a **renewal pipeline view** showing:

| View | Description |
|------|-------------|
| **Upcoming Renewals** | Subscriptions expiring in next 7/14/30 days |
| **Past Due** | Subscriptions that expired but have not yet cancelled (grace period) |
| **Recently Renewed** | Subscriptions that renewed in the last 30 days |
| **At Risk** | Users who turned off auto-renew or are past due |

#### 3.4.2 Cancellation Flow

```
User requests cancellation (via app/web)
         ↓
Admin sees in "Pending Cancellations" queue
         ↓
Admin reviews: subscription details, usage stats, order history
         ↓
Admin can:
  a) Process cancellation → subscription ends at current period end
  b) Offer retention (manual outreach, extend grace period)
  c) Immediate cancellation (with optional pro-rated refund)
         ↓
Cancellation logged in audit trail
```

#### 3.4.3 Cancellation Data Model Extension

| Field | Type | Description |
|-------|------|-------------|
| `cancellation_type` | Enum | `END_OF_PERIOD`, `IMMEDIATE` |
| `cancellation_reason` | Enum | `TOO_EXPENSIVE`, `NOT_USEFUL`, `SWITCHING_PRODUCT`, `TECHNICAL_ISSUES`, `OTHER` |
| `cancellation_feedback` | Text? | Free-text feedback from user |
| `retention_offered` | Boolean | Whether admin offered a retention deal |
| `retention_accepted` | Boolean? | Whether user accepted the retention offer |
| `processed_by` | UUID? | Admin user who processed the cancellation |
| `processed_at` | Timestamp? | When admin processed the cancellation |

#### 3.4.4 Admin UI — Renewal & Cancellation

| Screen | Features |
|--------|----------|
| **Renewal Dashboard** | Card-based summary: Upcoming (7d), Upcoming (30d), Past Due, At Risk |
| **Renewal Calendar** | Calendar view showing renewal dates clustered per day |
| **Cancellation Queue** | List of pending cancellation requests with user details |
| **Cancellation Detail** | Full cancellation review: reason, usage stats, order history, action buttons |
| **Cancellation Analytics** | Charts showing cancellation reasons, churn rate over time |

#### 3.4.5 User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| RC-01 | Admin | See all subscriptions expiring in the next 30 days | I can plan for revenue forecasting |
| RC-02 | Admin | View a queue of pending cancellation requests | I can process them in a timely manner |
| RC-03 | Admin | See the user's cancellation reason and feedback | I can understand churn drivers |
| RC-04 | Admin | Process a cancellation (end-of-period or immediate) | I can fulfill the user's request |
| RC-05 | Admin | Offer a retention deal (extend grace period, offer discount) | I can reduce churn |
| RC-06 | Admin | View past-due subscriptions | I can decide whether to send reminders or auto-cancel |
| RC-07 | Admin | See churn analytics over time | I can identify trends and take corrective action |

---

## 4. Admin Dashboard — Overview Page

The admin dashboard homepage provides a high-level overview:

### 4.1 Dashboard KPIs

| KPI Card | Metric |
|----------|--------|
| **Tổng Người Dùng** (Total Users) | Count of registered users |
| **Đang Hoạt Động** (Active Subscriptions) | Count of ACTIVE subscriptions |
| **Doanh Thu Tháng** (Monthly Revenue) | Sum of completed orders this month |
| **Tỷ Lệ Hủy** (Churn Rate) | % of cancellations vs total active in period |
| **Đơn Hàng Chờ** (Pending Orders) | Count of PENDING orders |
| **Sắp Hết Hạn** (Expiring Soon) | Subscriptions expiring within 7 days |

### 4.2 Dashboard Charts

| Chart | Type | Data |
|-------|------|------|
| Revenue Trend | Line chart | Monthly revenue over last 12 months |
| Subscription Distribution | Donut chart | Users per tier (Free/Premium/Enterprise) |
| New Users Trend | Bar chart | New registrations per week |
| Churn Rate Trend | Line chart | Monthly churn % |

---

## 5. Admin Navigation Structure

```
┌─────────────────────────────────────────┐
│  Heritage Cloud Admin                    │
├──────────────┬──────────────────────────┤
│              │                          │
│  📊 Tổng Quan│   [Dashboard Content]    │
│  (Dashboard) │                          │
│              │                          │
│  📋 Gói Đăng │                          │
│  Ký (Tiers)  │                          │
│              │                          │
│  👥 Người    │                          │
│  Dùng (Users)│                          │
│              │                          │
│  📦 Đơn Hàng │                          │
│  (Orders)    │                          │
│              │                          │
│  🔄 Gia Hạn  │                          │
│  (Renewals)  │                          │
│              │                          │
│  ⚙️ Cài Đặt  │                          │
│  (Settings)  │                          │
│              │                          │
└──────────────┴──────────────────────────┘
```

### 5.1 Menu Items

| # | Icon | Label (VI) | Label (EN) | Route | Module |
|---|------|-----------|-----------|-------|--------|
| 1 | `LayoutDashboard` | Tổng Quan | Dashboard | `/` | Overview KPIs & Charts |
| 2 | `CreditCard` | Gói Đăng Ký | Subscription Tiers | `/tiers` | Tier CRUD |
| 3 | `Users` | Người Dùng | Users | `/users` | User account & subscription management |
| 4 | `ShoppingCart` | Đơn Hàng | Orders | `/orders` | Order management |
| 5 | `RefreshCcw` | Gia Hạn & Hủy | Renewals & Cancellations | `/renewals` | Renewal pipeline & cancellation queue |
| 6 | `Settings` | Cài Đặt | Settings | `/settings` | Admin settings, audit log |

---

## 6. Data Architecture

### 6.1 Shared Database, Separate PostgreSQL Schemas

The admin app connects to the **same Supabase PostgreSQL database** as gia-pha-web, but admin-managed tables live in a **dedicated `admin` PostgreSQL schema** — separate from the `public` schema used by gia-pha-web. This provides clean logical separation visible in the Supabase Table Editor.

```
Supabase PostgreSQL Database
├── public schema (owned by gia-pha-web):
│   ┌──────────────────────┐
│   │  users               │
│   ├──────────────────────┤
│   │  user_profiles       │
│   ├──────────────────────┤
│   │  clans               │
│   ├──────────────────────┤
│   │  members             │
│   ├──────────────────────┤
│   │  relationships       │
│   ├──────────────────────┤
│   │  ritual_events       │
│   ├──────────────────────┤
│   │  duties              │
│   ├──────────────────────┤
│   │  grave_sites         │
│   ├──────────────────────┤
│   │  audit_logs          │
│   └──────────────────────┘
│
├── admin schema (owned by gia-pha-admin):
│   ┌──────────────────────┐
│   │  subscription_tiers  │───► Referenced by public.users via JOINs
│   ├──────────────────────┤
│   │  user_subscriptions  │───► FK → public.users, public.clans
│   ├──────────────────────┤
│   │  orders              │───► FK → public.users, public.clans
│   ├──────────────────────┤
│   │  order_billing_info  │
│   ├──────────────────────┤
│   │  cancellation_requests│
│   ├──────────────────────┤
│   │  admin_users         │
│   ├──────────────────────┤
│   │  admin_audit_logs    │───► FK → admin.admin_users
│   └──────────────────────┘
│
├── auth schema (managed by Supabase)
├── storage schema (managed by Supabase)
└── ...
```

#### 6.1.1 Why Separate PostgreSQL Schemas?

| Benefit | Detail |
|---------|--------|
| **Clean Supabase UI** | Admin tables appear under `admin` schema dropdown in Table Editor, not mixed with 20+ web tables |
| **Clear ownership** | `public` = gia-pha-web owns and migrates. `admin` = gia-pha-admin owns and migrates. No migration conflicts. |
| **RLS simplification** | Admin schema tables don't need RLS (only accessed via service-role key). `public` schema tables retain their existing RLS policies. |
| **Cross-schema FK works** | PostgreSQL natively supports foreign keys across schemas (e.g., `admin.user_subscriptions.user_id → public.users.id`) |
| **No new Supabase project** | Both schemas exist within the same Supabase PostgreSQL instance — no extra cost, no data sync needed |

#### 6.1.2 Prisma multiSchema Configuration

Prisma v7 supports multi-schema via the `multiSchema` preview feature. Each model is tagged with `@@schema("public")` or `@@schema("admin")`:

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

// Existing table in public schema (read-only stub in admin app)
model User {
  id    String @id @db.Uuid
  email String @unique
  // ...
  @@schema("public")
  @@map("users")
}

// New table in admin schema
model SubscriptionTier {
  id   String @id @db.Uuid
  slug String @unique
  // ...
  @@schema("admin")
  @@map("subscription_tiers")
}
```

#### 6.1.3 Schema Setup & Migration Order

Setup must follow this exact sequence:

| Step | Where | Action |
|------|-------|--------|
| 1 | Supabase SQL Editor | Create `admin` schema + grant base permissions |
| 2 | gia-pha-admin | Run Prisma migration with `--create-only`, review generated SQL to remove public schema statements, then apply |
| 3 | Supabase SQL Editor | Grant `SELECT` on `admin.subscription_tiers` to `anon` and `authenticated`, grant `SELECT` on `admin.user_subscriptions` to `authenticated` |
| 4 | gia-pha-admin | Run seed script (default tiers + admin user) |
| 5 | gia-pha-web | Add `multiSchema` + `@@schema()` annotations to all existing models/enums + add admin table stubs, run migration |

```sql
-- Step 1: Run in Supabase SQL Editor
CREATE SCHEMA IF NOT EXISTS admin;
GRANT USAGE ON SCHEMA admin TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA admin TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA admin GRANT ALL ON TABLES TO postgres, service_role;
```

> **IMPORTANT:** Both gia-pha-admin and gia-pha-web share the same `_prisma_migrations` table. Never run `prisma migrate reset` from either project. Use `--create-only` to review generated SQL before applying. See IP-01 Task 1.2 for the full safe migration workflow.

### 6.2 RLS Consideration & Admin Audit Logging

The admin app uses a **service-role key** (not RLS-scoped) to bypass row-level security, since the admin needs cross-tenant visibility. Tables in the `admin` PostgreSQL schema do **not** have RLS policies enabled — they are only accessed by the admin app via the service-role key.

**Admin Audit Logging Strategy:** The existing `public.audit_logs` table (from gia-pha-web) is scoped by `clan_id` and protected by RLS — it is designed for per-clan activity tracking. Admin actions are fundamentally different: they are **cross-tenant** (e.g., editing a tier affects all clans) or **user-specific** (e.g., disabling a user account). To avoid overloading the clan-scoped table with admin entries, the admin uses a **dedicated `admin.admin_audit_logs` table** (in the `admin` schema):

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `admin_user_id` | UUID | FK → `admin_users.id` — which admin performed the action |
| `action` | String | Action performed (e.g., `tier.create`, `tier.update`, `user.disable`, `subscription.upgrade`, `order.confirm_payment`) |
| `entity_type` | String | Target entity type (e.g., `subscription_tier`, `user_subscription`, `order`, `user`) |
| `entity_id` | UUID | Target entity's primary key |
| `old_value` | JSONB? | Previous state of changed fields (null for create actions) |
| `new_value` | JSONB? | New state of changed fields (null for delete actions) |
| `ip_address` | String? | Admin's IP address |
| `created_at` | Timestamp | When the action occurred |

This separation keeps clan-scoped audit logs clean for end-user activity while giving the admin panel its own complete audit trail.

### 6.3 API Integration with gia-pha-web

The subscription tier data is consumed by the gia-pha-web landing page's pricing section via a **public API endpoint** (no auth required). Since gia-pha-web also uses Prisma with `multiSchema`, it can query the `admin.subscription_tiers` table directly:

```
GET /api/public/pricing → Queries admin.subscription_tiers, returns active tiers ordered by display_order
```

### 6.4 Feature Gating Strategy (gia-pha-web Enforcement)

The `limits` JSONB field on each `admin.subscription_tiers` record defines usage caps. gia-pha-web is responsible for **enforcing** these limits at the application layer. This section specifies the contract between admin-managed tiers (in the `admin` schema) and web-side enforcement (querying `public` schema tables for usage counts).

#### 6.4.1 Gated Operations

| Operation | Limit Key | Check Point |
|-----------|-----------|-------------|
| Add a family member | `max_members` | `POST /api/members` — count existing members for clan vs. limit |
| Upload media (photo, document, panorama) | `max_media_mb` | `POST /api/media/upload` — sum of existing media size for clan vs. limit |
| Register a grave site | `max_grave_sites` | `POST /api/grave-sites` — count existing grave sites for clan vs. limit |
| Create a ritual event | `max_rituals` | `POST /api/ritual-events` — count existing rituals for clan vs. limit |

#### 6.4.2 Enforcement Flow

```
User action (e.g., add member)
        ↓
gia-pha-web API route
        ↓
checkSubscriptionLimits(clanId, limitKey)
        ↓
Query: admin.user_subscriptions → admin.subscription_tiers.limits
        ↓
Compare against public schema usage count (members, media, etc.)
        ↓
IF under limit → proceed with action
IF at/over limit → return HTTP 403 with limit detail
```

#### 6.4.3 Limit Exceeded Response Format

```json
{
  "error": "SUBSCRIPTION_LIMIT_REACHED",
  "message": "Bạn đã đạt giới hạn thành viên cho gói Miễn Phí (30/30). Vui lòng nâng cấp gói.",
  "detail": {
    "limitKey": "max_members",
    "currentUsage": 30,
    "tierLimit": 30,
    "tierName": "Miễn Phí",
    "upgradeUrl": "/pricing"
  }
}
```

#### 6.4.4 Special Cases

- A limit value of `-1` or `null` means **unlimited** (no enforcement check needed)
- When an admin upgrades a user's tier, the new limits take effect immediately — no cache invalidation needed since gia-pha-web queries the DB per request
- When an admin downgrades a user's tier and their current usage exceeds the new limits, existing data is **not deleted** — the user simply cannot add more until they are within limits or upgrade again

---

## 7. Non-Functional Requirements

### 7.1 Security

| Requirement | Implementation |
|-------------|----------------|
| Admin authentication | Separate admin auth (email/password with 2FA) |
| Role-based access | SUPER_ADMIN (full), SUPPORT (read-only + limited actions) |
| Audit logging | All CRUD operations logged in `admin_audit_logs` with admin user ID, action, entity, old/new values (see §6.2) |
| Data encryption | HTTPS only, database encrypted at rest (Supabase default) |
| Session timeout | 30-minute inactivity timeout |

### 7.2 Performance

| Metric | Target |
|--------|--------|
| Dashboard load time | < 2 seconds |
| Table pagination | 50 rows/page, < 500ms response |
| Search response | < 1 second |
| CSV export (1000 rows) | < 5 seconds |

### 7.3 Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigable tables and forms
- Screen reader compatible
- High contrast mode support

---

## 8. Design Direction

### 8.1 Visual Identity

The admin panel uses a **professional, clean design** — distinct from the cultural/imperial aesthetic of the public-facing app:

| Element | Style |
|---------|-------|
| **Background** | Clean white / light gray (#F9FAFB) |
| **Sidebar** | Dark charcoal (#1F2937) with gold accent highlights (#C5A059) |
| **Accent Color** | Heritage Gold (#C5A059) — ties admin branding to main product |
| **Typography** | Inter (sans-serif, professional, high readability) |
| **Tables** | Stripe-hover pattern, sticky headers |
| **Cards** | Soft shadow, rounded corners, white background |
| **Status Badges** | Color-coded: green (active), yellow (pending), red (cancelled), gray (expired) |

### 8.2 Responsive

- Primary target: Desktop (admin panels are primarily used on desktop)
- Tablet: Responsive sidebar collapses to icons
- Mobile: Basic support (not primary use case)

---

## 9. Out of Scope (V1)

- ❌ Automated payment gateway integration (Stripe, MoMo API) — manual payment confirmation for now
- ❌ Automated email notifications for renewals/cancellations — manual admin outreach
- ❌ Self-service cancellation in gia-pha-web (admin processes all cancellations)
- ❌ Coupon/discount code system
- ❌ Multi-currency support (VND only)
- ❌ Invoice PDF generation
- ❌ Real-time WebSocket updates

---

## 10. Future Enhancements (V2+)

| Feature | Priority |
|---------|----------|
| Stripe/MoMo/ZaloPay payment gateway integration | High |
| Automated renewal email reminders | High |
| Self-service cancellation with retention flow | Medium |
| Coupon and discount code management | Medium |
| Invoice PDF generation | Medium |
| Revenue forecasting dashboard | Low |
| Multi-currency support (USD for overseas Vietnamese) | Low |
| Webhook integration for payment status updates | Low |
