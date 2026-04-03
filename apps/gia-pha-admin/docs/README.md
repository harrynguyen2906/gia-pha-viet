# Heritage Cloud Admin — Documentation Index

> **Project:** gia-pha-admin  
> **Purpose:** Internal admin dashboard for Heritage Cloud (Gia Phả Việt) subscription management  
> **Version:** 1.0  
> **Created:** 2026-03-25

---

## 1. Vision

The Heritage Cloud Admin is a **standalone internal web application** that provides platform operators with full visibility and control over the subscription lifecycle of the Heritage Cloud SaaS platform. It connects to the **same Supabase PostgreSQL database** as the main gia-pha-web application.

---

## 2. Core Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Subscription Tier Management** | CRUD operations on pricing tiers displayed on the landing page |
| 2 | **User & Subscription Management** | View all users, manage accounts (enable/disable), manage subscription status, upgrades, downgrades |
| 3 | **Order Management** | Track purchase orders, billing info, payment confirmations, refunds |
| 4 | **Renewal & Cancellation Management** | Renewal pipeline, cancellation queue, churn analytics |
| 5 | **Dashboard Overview** | KPI cards, revenue charts, tier distribution, user growth |

---

## 3. Document Index

### Product Requirements (PRD)

| Document | Covers |
|----------|--------|
| [PRD-01-subscription-management.md](prd/PRD-01-subscription-management.md) | Complete product requirements for all 4 subscription management modules |

### Implementation Plans (IP)

| Document | Covers |
|----------|--------|
| [IP-01-subscription-management.md](implementation/IP-01-subscription-management.md) | Sprint-by-sprint implementation tasks, Prisma schema, API routes, UI components |

### UI Design (Future)

| Document | Covers |
|----------|--------|
| _To be created_ | Wireframes and mockups for admin dashboard |

---

## 4. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Supabase (shared DB, separate `admin` schema) |
| ORM | Prisma v7 (service-role, bypasses RLS, `multiSchema` preview feature) |
| Auth | NextAuth v5 (admin-specific credentials) |
| Charts | Recharts |
| State | Zustand + SWR |
| Icons | Lucide React |
| Validation | Zod |
| Drag & Drop | @dnd-kit |

---

## 5. Architecture

```
┌──────────────────┐     ┌──────────────────┐
│   gia-pha-web    │     │  gia-pha-admin   │
│  (Public + App)  │     │  (Internal)      │
│                  │     │                  │
│  Port: 3000      │     │  Port: 3001      │
│  RLS-scoped      │     │  Service-role    │
│  User-facing     │     │  Admin-facing    │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └────────────┬───────────┘
                      │
              ┌───────▼────────┐
              │   Supabase     │
              │  PostgreSQL    │
              │  (Shared DB)   │
              ├────────────────┤
              │ public schema  │ ← gia-pha-web tables
              │  users, clans, │   (members, rituals,
              │  members, ...  │    grave_sites, etc.)
              ├────────────────┤
              │ admin schema   │ ← gia-pha-admin tables
              │  subscription_ │   (tiers, orders,
              │  tiers, ...    │    admin_users, etc.)
              └────────────────┘
```

### PostgreSQL Schema Separation

Both apps connect to the **same Supabase database** but use **separate PostgreSQL schemas**:

| PG Schema | Owner | Tables |
|-----------|-------|--------|
| `public` | gia-pha-web | users, clans, members, relationships, ritual_events, duties, grave_sites, etc. |
| `admin` | gia-pha-admin | subscription_tiers, user_subscriptions, orders, admin_users, admin_audit_logs, etc. |

Prisma v7's `multiSchema` preview feature enables cross-schema foreign keys (e.g., `admin.user_subscriptions.user_id → public.users.id`).

---

## 6. Sprint Roadmap

| Sprint | Duration | Focus |
|--------|----------|-------|
| Sprint 1 | 1 week | Project setup, DB schema migration, admin auth, layout |
| Sprint 2 | 1 week | Dashboard KPIs, tier management CRUD |
| Sprint 3 | 1.5 weeks | User account & subscription management, order management |
| Sprint 4 | 1 week | Renewal pipeline, cancellation queue, analytics, polish |

**Total Estimated Effort:** 4–5 weeks

---

## 7. Database Tables (New — `admin` PostgreSQL Schema)

All new tables are created in the **`admin` PostgreSQL schema** (not `public`):

| Table (in `admin` schema) | Records |
|---------------------------|---------|
| `admin.subscription_tiers` | Pricing plans (Free, Premium, Enterprise) |
| `admin.user_subscriptions` | User-to-tier mapping with lifecycle status |
| `admin.orders` | Purchase transactions |
| `admin.order_billing_info` | Billing details per order |
| `admin.cancellation_requests` | Cancellation requests with reasons |
| `admin.admin_users` | Admin panel users (separate from gia-pha-web users) |
| `admin.admin_audit_logs` | Admin action audit trail (separate from clan-scoped `audit_logs`) |

> **Note:** These tables are **additive** — no changes to existing gia-pha-web tables in the `public` schema. The admin Prisma schema includes read-only stubs for `public.users`, `public.user_profiles`, and `public.clans` (with `@@schema("public")`) to enable cross-schema Prisma relation joins.
