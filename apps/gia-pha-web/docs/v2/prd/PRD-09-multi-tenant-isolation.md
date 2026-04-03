# PRD-09: Heritage Cloud — Multi-Tenant Data Isolation

> **Version:** 2.0  
> **Module:** Tenant Isolation & Data Security  
> **Status:** Draft  
> **Created:** 2026-03-03  
> **Dependencies:** PRD-00 (Design System), PRD-08 (Authentication)  
> **Critical Level:** 🔴 HIGH — Security & Privacy

---

## 1. Overview & Purpose

### 1.1 Problem Statement
In V1, Heritage Cloud operates as a **single-tenant** application: one deployment serves one clan. As we transition to a multi-tenant SaaS model where multiple clans (families) share the same infrastructure, we MUST ensure:
- Users of Clan A **cannot see, access, or infer** data belonging to Clan B
- All data queries are automatically scoped to the authenticated user's clan
- API endpoints enforce tenant boundaries at every layer
- Database-level isolation prevents accidental cross-tenant data leaks

### 1.2 Multi-Tenant Strategy: **Shared Database, Shared Schema**

Heritage Cloud uses a **shared database with row-level tenant scoping** (most cost-effective for 1K–10K users):

```
┌──────────────────────────────────────────────────────┐
│                 Single PostgreSQL DB                   │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Clan A   │  │ Clan B   │  │ Clan C   │  ...       │
│  │ members  │  │ members  │  │ members  │            │
│  │ rituals  │  │ rituals  │  │ rituals  │            │
│  │ duties   │  │ duties   │  │ duties   │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                        │
│  Every row has clan_id → used for isolation            │
└──────────────────────────────────────────────────────┘
```

| Approach | Pros | Cons | Our Choice |
|----------|------|------|-----------|
| Separate DB per clan | Strongest isolation | Expensive, hard to manage | ❌ |
| Separate schema per clan | Good isolation | Complex migrations | ❌ |
| **Shared schema, row-level isolation** | Cost-effective, simple | Requires careful query scoping | ✅ |

### 1.3 Success Criteria
| Criteria | Target |
|----------|--------|
| Zero cross-tenant data leaks | 100% isolation |
| All API queries include `clan_id` filter | 100% coverage |
| RLS policies on all tenant-scoped tables | All 12+ tables |
| Performance impact of isolation middleware | < 5ms overhead |

---

## 2. Tenant Model

### 2.1 What is a Tenant?
In Heritage Cloud, **1 Tenant = 1 Clan**. The `clans` table is the tenant boundary.

### 2.2 Tenant Relationship to Users
```
                     ┌────────────┐
                     │   Clan     │ ← Tenant boundary
                     │ (tenant)   │
                     └─────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────┴────┐  ┌───┴────┐  ┌───┴────┐
         │ User A  │  │ User B │  │ User C │
         │ HEAD    │  │ ELDER  │  │ MEMBER │
         └─────────┘  └────────┘  └────────┘
```

**Rules:**
- Each user belongs to **exactly one** clan (`users.clan_id`)
- A user's `clan_id` is set at registration and **cannot be changed** by the user
- The `clan_id` in the JWT token is the source of truth for all data access
- Users with no `clan_id` (e.g., newly registered without clan) have read-only access to nothing

### 2.3 Tenant-Scoped Tables
Every table that contains clan-specific data MUST have a `clan_id` foreign key:

| Table | Has `clan_id` | Isolation Method |
|-------|:------------:|----------------|
| `users` | ✅ | Direct FK |
| `user_profiles` | Via `users.clan_id` | JOIN through users |
| `clans` | Self (id) | Filtered by user's clan |
| `members` | ✅ | Direct FK |
| `relationships` | Via `members.clan_id` | JOIN through members |
| `member_spouses` | Via `members.clan_id` | JOIN through members |
| `member_media` | Via `members.clan_id` | JOIN through members |
| `grave_sites` | ✅ | Direct FK |
| `site_media` | Via `grave_sites.clan_id` | JOIN through sites |
| `ritual_events` | ✅ | Direct FK |
| `ritual_instructions` | Via `ritual_events.clan_id` | JOIN through rituals |
| `ritual_duties` | Via `ritual_events.clan_id` | JOIN through rituals |
| `duties` | ✅ | Direct FK |
| `duty_logs` | Via `duties.clan_id` | JOIN through duties |
| `notifications` | Via `users.clan_id` | Filtered by user_id |
| `virtual_offerings` | Via `members.clan_id` | JOIN through members |
| `audit_logs` | ✅ | Direct FK |

### 2.4 Non-Tenant Tables
These tables are system-wide and not scoped to a clan:

| Table | Reason |
|-------|--------|
| `password_reset_tokens` | System auth, linked to user (no direct clan) |

---

## 3. Isolation Layers

Heritage Cloud implements **defense-in-depth** with 3 isolation layers:

```
    Request → [Layer 1: Middleware] → [Layer 2: Application] → [Layer 3: Database]
              (JWT clan_id check)      (Prisma query scoping)    (RLS policies)
```

### 3.1 Layer 1: Middleware — JWT Claim Validation

Every authenticated API request:
1. Extracts `clanId` from NextAuth JWT token
2. Rejects requests if `clanId` is missing
3. Passes `clanId` to route handlers

```typescript
// In auth middleware / route helpers:
const session = await auth();
if (!session?.user?.clanId) {
  return Response.json({ error: "No clan access" }, { status: 403 });
}
const clanId = session.user.clanId;
```

### 3.2 Layer 2: Application — Prisma Query Scoping

All Prisma queries MUST include `where: { clanId }` filter. This is enforced via:

**Option A — Helper function (recommended for v2):**
```typescript
// src/lib/tenant.ts
export function withTenant(clanId: string) {
  return { where: { clanId } };
}

// Usage in API routes:
const members = await prisma.member.findMany({
  where: { clanId, deletedAt: null },
});
```

**Option B — Prisma client extension (future v3):**
```typescript
// Auto-inject clanId into every query via Prisma extension
const tenantPrisma = prisma.$extends({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, clanId };
        return query(args);
      },
    },
  },
});
```

### 3.3 Layer 3: Database — Row-Level Security (RLS)

PostgreSQL RLS policies as a **safety net** — even if application code has a bug, the database prevents cross-tenant access.

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE members FORCE ROW LEVEL SECURITY;

-- Policy: users can only see their clan's members
CREATE POLICY tenant_isolation_members ON members
  USING (clan_id = current_setting('app.current_clan_id')::uuid);
```

**How RLS gets the `clan_id`:**
```sql
-- Set before every query via Prisma middleware or raw SQL
SET LOCAL app.current_clan_id = '<clan-uuid>';
```

> **Note:** RLS is the LAST line of defense. Application-level filtering (Layer 2) is the primary mechanism. RLS catches any query that accidentally bypasses application filtering.

---

## 4. API Security Rules

### 4.1 Required for Every API Route

Every API route handler that accesses tenant data MUST:

```typescript
// 1. Authenticate
const session = await auth();
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

// 2. Extract tenant
const clanId = session.user.clanId;
if (!clanId) return Response.json({ error: "No clan" }, { status: 403 });

// 3. Use clanId in ALL queries
const data = await prisma.member.findMany({
  where: { clanId, ... },
});
```

### 4.2 Object-Level Authorization

For operations on specific resources (GET/PUT/DELETE by ID):

```typescript
// When accessing a specific member:
const member = await prisma.member.findUnique({
  where: { id: memberId },
});

// ALWAYS verify the resource belongs to the user's clan
if (!member || member.clanId !== clanId) {
  return Response.json({ error: "Not found" }, { status: 404 });
  // Return 404 (not 403) to avoid revealing resource existence
}
```

### 4.3 Cross-Tenant Relationship Prevention

Prevent creating relationships across clans:

```typescript
// When creating a parent-child relationship:
const parent = await prisma.member.findUnique({ where: { id: parentId } });
const child = await prisma.member.findUnique({ where: { id: childId } });

// Both members MUST belong to the same clan as the requesting user
if (parent?.clanId !== clanId || child?.clanId !== clanId) {
  return Response.json({ error: "Invalid members" }, { status: 400 });
}
```

### 4.4 Audit Trail per Tenant

All mutations include `clanId` in audit logs:

```typescript
await prisma.auditLog.create({
  data: {
    clanId,           // ← Tenant scope
    userId: session.user.id,
    action: "MEMBER_CREATED",
    entityType: "Member",
    entityId: newMember.id,
    changes: JSON.stringify(diff),
  },
});
```

---

## 5. User Stories

| ID | As a... | I want... | So that... |
|----|---------|-----------|-----------|
| MT-01 | Clan A user | My data queries to only return Clan A data | I never see other families' information |
| MT-02 | Clan B user | To be unable to access Clan A's member profiles | Other families' privacy is protected |
| MT-03 | Any user | API to reject cross-clan resource access with 404 | I can't even confirm other clans' data existence |
| MT-04 | HEAD_OF_HOUSE | All new members I create to auto-assign to my clan | Data is always correctly scoped |
| MT-05 | System admin | Cross-tenant audit logs to detect anomalies | I can monitor for security issues |
| MT-06 | Any user | My JWT to contain my clan_id | Every request is automatically scoped |

---

## 6. Testing Requirements

### 6.1 Isolation Test Cases

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | User A (Clan 1) lists members | Only Clan 1 members returned |
| 2 | User A fetches Clan 2 member by ID | 404 Not Found |
| 3 | User A creates member | Member has `clanId` = Clan 1 |
| 4 | User A creates relationship with Clan 2 member | 400 Bad Request |
| 5 | User A lists rituals | Only Clan 1 rituals returned |
| 6 | User A accesses duty from Clan 2 | 404 Not Found |
| 7 | User A lists grave sites | Only Clan 1 sites returned |
| 8 | User with no clan_id accesses any endpoint | 403 Forbidden |
| 9 | JWT without clanId reaches API | 403 Forbidden |
| 10 | Two users in same clan see same data | Identical results |

### 6.2 Performance Tests
- Query overhead with `clanId` filter: < 5ms (indexed)
- RLS overhead: < 2ms per query
- 100 concurrent clans, 1000 members each: query time < 50ms

---

## 7. Migration Path from V1

### 7.1 For Existing V1 Data
If there's existing data from V1 (single-tenant):
1. All existing data already has `clan_id` (V1 had one clan)
2. Add RLS policies (non-breaking — they just enforce existing behavior)
3. Add tenant middleware (non-breaking — existing API already filters by clan)

### 7.2 Breaking Changes
- None for existing users
- New users must create a clan during registration (PRD-08)

---

## 8. Out of Scope for V2

- ❌ Cross-clan sharing (viewing another clan's public tree)
- ❌ Clan invitation system (adding users to existing clan)
- ❌ Clan admin panel (managing clan members/roles)
- ❌ Data export per tenant
- ❌ Tenant-level storage quotas
- ❌ Separate encryption keys per tenant
