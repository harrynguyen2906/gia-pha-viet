# IP-09: Multi-Tenant Data Isolation Implementation Plan

> **Phase:** V2 — Tenant Isolation  
> **PRD Reference:** PRD-09-multi-tenant-isolation.md  
> **Depends on:** IP-08 (Authentication — JWT must contain clanId)  
> **Critical Level:** 🔴 HIGH — Security  
> **Estimated Effort:** 1 sprint (5–7 days)

---

## Overview

Implement defense-in-depth multi-tenant isolation across 3 layers:
1. **Middleware** — JWT `clanId` validation
2. **Application** — Prisma query scoping helpers
3. **Database** — PostgreSQL Row-Level Security (RLS) policies

---

## Task 1: Tenant Helper Library

**ID:** `MT-001`  
**Output:** `src/lib/tenant.ts`

### Steps

1. Create tenant helper functions:
   ```typescript
   // src/lib/tenant.ts
   import { auth } from "@/lib/auth";

   /**
    * Extract and validate clanId from the current session.
    * Throws if no session or no clan.
    */
   export async function getTenantContext() {
     const session = await auth();

     if (!session?.user) {
       throw new TenantError("UNAUTHENTICATED", 401);
     }

     if (!session.user.clanId) {
       throw new TenantError("NO_CLAN", 403);
     }

     return {
       userId: session.user.id,
       clanId: session.user.clanId,
       role: session.user.role,
     };
   }

   export class TenantError extends Error {
     constructor(
       public code: string,
       public status: number,
     ) {
       super(code);
     }
   }

   /**
    * Verify a resource belongs to the user's clan.
    * Returns 404 (not 403) to avoid revealing existence.
    */
   export function assertTenantOwnership(
     resource: { clanId: string } | null,
     expectedClanId: string,
   ): asserts resource is NonNullable<typeof resource> {
     if (!resource || resource.clanId !== expectedClanId) {
       throw new TenantError("NOT_FOUND", 404);
     }
   }
   ```

2. Create API route error handler:
   ```typescript
   // src/lib/api-helpers.ts
   import { TenantError } from "./tenant";

   export function handleApiError(error: unknown) {
     if (error instanceof TenantError) {
       const messages: Record<string, string> = {
         UNAUTHENTICATED: "Vui lòng đăng nhập",
         NO_CLAN: "Không có quyền truy cập dòng tộc",
         NOT_FOUND: "Không tìm thấy",
       };
       return Response.json(
         { error: messages[error.code] || error.code },
         { status: error.status },
       );
     }
     console.error("Unhandled API error:", error);
     return Response.json(
       { error: "Lỗi hệ thống" },
       { status: 500 },
     );
   }
   ```

### DoD
- [ ] `getTenantContext()` returns `{ userId, clanId, role }`
- [ ] Throws 401 for unauthenticated, 403 for no clan
- [ ] `assertTenantOwnership()` throws 404 for cross-tenant access
- [ ] Error handler returns Vietnamese messages

---

## Task 2: Refactor Existing API Routes

**ID:** `MT-002`  
**Output:** All API routes use tenant scoping

### Routes to Update

| Route | File | Change |
|-------|------|--------|
| `GET/POST /api/v1/members` | `src/app/api/v1/members/route.ts` | Add `clanId` filter to all queries |
| `GET/PUT/DELETE /api/v1/members/[id]` | `src/app/api/v1/members/[id]/route.ts` | Verify member ownership |
| `POST /api/v1/relationships` | Relationships route | Verify both members same clan |
| `GET/POST /api/v1/rituals` | Rituals route | Add `clanId` filter |
| `GET/POST /api/v1/duties` | Duties route | Add `clanId` filter |
| `GET/POST /api/v1/sites` | Sites route | Add `clanId` filter |
| `GET /api/v1/clan/stats` | Clan route | Scope stats to user's clan |
| `GET /api/v1/search` | Search route | Add `clanId` to search scope |

### Pattern for Each Route

**Before (V1):**
```typescript
export async function GET() {
  const members = await prisma.member.findMany({
    where: { deletedAt: null },
  });
  return Response.json(members);
}
```

**After (V2):**
```typescript
export async function GET() {
  try {
    const { clanId } = await getTenantContext();
    const members = await prisma.member.findMany({
      where: { clanId, deletedAt: null },
    });
    return Response.json(members);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**For single-resource routes (GET by ID):**
```typescript
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { clanId } = await getTenantContext();
    const member = await prisma.member.findUnique({
      where: { id: params.id },
    });
    assertTenantOwnership(member, clanId);
    return Response.json(member);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**For mutations (POST/PUT):**
```typescript
export async function POST(req: Request) {
  try {
    const { clanId, userId } = await getTenantContext();
    const body = await req.json();
    // Validate body...

    const member = await prisma.member.create({
      data: {
        ...validatedData,
        clanId,             // ← Always inject clanId from session
        createdBy: userId,  // ← Track who created
      },
    });
    return Response.json(member, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### DoD
- [ ] Every API route uses `getTenantContext()`
- [ ] Every query includes `clanId` filter
- [ ] Every mutation injects `clanId` from session (never from request body)
- [ ] Single-resource access verified with `assertTenantOwnership()`
- [ ] Relationship creation verifies both sides same clan

---

## Task 3: PostgreSQL Row-Level Security (RLS)

**ID:** `MT-003`  
**Output:** SQL migration for RLS policies

### Steps

1. Create migration file for RLS policies:
   ```sql
   -- Migration: add_rls_policies

   -- 1. Create function to get current clan from session variable
   CREATE OR REPLACE FUNCTION current_clan_id() RETURNS uuid AS $$
     SELECT COALESCE(
       nullif(current_setting('app.current_clan_id', true), ''),
       '00000000-0000-0000-0000-000000000000'
     )::uuid;
   $$ LANGUAGE sql STABLE;

   -- 2. Enable RLS on all tenant-scoped tables
   ALTER TABLE members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
   ALTER TABLE member_spouses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE member_media ENABLE ROW LEVEL SECURITY;
   ALTER TABLE grave_sites ENABLE ROW LEVEL SECURITY;
   ALTER TABLE site_media ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ritual_events ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ritual_instructions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ritual_duties ENABLE ROW LEVEL SECURITY;
   ALTER TABLE duties ENABLE ROW LEVEL SECURITY;
   ALTER TABLE duty_logs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE virtual_offerings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
   ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

   -- 3. Create policies for tables with direct clan_id
   CREATE POLICY tenant_members ON members
     USING (clan_id = current_clan_id());

   CREATE POLICY tenant_grave_sites ON grave_sites
     USING (clan_id = current_clan_id());

   CREATE POLICY tenant_ritual_events ON ritual_events
     USING (clan_id = current_clan_id());

   CREATE POLICY tenant_duties ON duties
     USING (clan_id = current_clan_id());

   CREATE POLICY tenant_audit_logs ON audit_logs
     USING (clan_id = current_clan_id());

   -- 4. Create policies for tables scoped via JOIN
   CREATE POLICY tenant_relationships ON relationships
     USING (parent_id IN (SELECT id FROM members WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_member_spouses ON member_spouses
     USING (member_a_id IN (SELECT id FROM members WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_member_media ON member_media
     USING (member_id IN (SELECT id FROM members WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_site_media ON site_media
     USING (site_id IN (SELECT id FROM grave_sites WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_ritual_instructions ON ritual_instructions
     USING (ritual_id IN (SELECT id FROM ritual_events WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_ritual_duties ON ritual_duties
     USING (ritual_id IN (SELECT id FROM ritual_events WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_duty_logs ON duty_logs
     USING (duty_id IN (SELECT id FROM duties WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_virtual_offerings ON virtual_offerings
     USING (member_id IN (SELECT id FROM members WHERE clan_id = current_clan_id()));

   CREATE POLICY tenant_notifications ON notifications
     USING (user_id IN (SELECT id FROM users WHERE clan_id = current_clan_id()));
   ```

2. **Important:** Force RLS for the application DB role (not the superuser):
   ```sql
   -- The Prisma connection role must NOT be a superuser
   -- RLS is bypassed for superusers
   ALTER TABLE members FORCE ROW LEVEL SECURITY;
   -- Repeat for all tables...
   ```

### DoD
- [ ] RLS enabled on all 14 tenant-scoped tables
- [ ] Policies use `current_clan_id()` function
- [ ] Migration runs without errors
- [ ] `FORCE ROW LEVEL SECURITY` on all tables

---

## Task 4: Prisma RLS Session Variable Injection

**ID:** `MT-004`  
**Output:** Prisma middleware to set RLS session variable

### Steps

1. Create Prisma extension or wrapper that sets the RLS variable before queries:
   ```typescript
   // src/lib/prisma-tenant.ts
   import { prisma } from "./prisma";

   /**
    * Execute a Prisma operation with RLS context set.
    * Sets `app.current_clan_id` PostgreSQL session variable
    * so RLS policies can filter by tenant.
    */
   export async function withTenantRLS<T>(
     clanId: string,
     operation: () => Promise<T>,
   ): Promise<T> {
     // Set the session variable for RLS
     await prisma.$executeRawUnsafe(
       `SET LOCAL app.current_clan_id = '${clanId}'`
     );
     return operation();
   }
   ```

   **Note:** For `SET LOCAL` to work correctly, the queries must be in the same transaction. In v2, application-level filtering (Layer 2) is the primary defense. RLS is the safety net.

2. Alternative approach (simpler, for v2):
   ```typescript
   // Just use application-level filtering as primary defense
   // RLS is enabled as safety net but not relied upon for primary filtering
   // The Prisma connection uses a non-superuser role so RLS is active
   ```

### DoD
- [ ] RLS session variable can be set per-request
- [ ] Application-level filtering remains the primary defense
- [ ] RLS catches any missed filters as safety net

---

## Task 5: Clan Auto-Assignment on Data Creation

**ID:** `MT-005`  
**Output:** Updated create operations across all routes

### Rules

All data creation MUST auto-assign `clanId` from the session:

```typescript
// NEVER trust clanId from request body
// ALWAYS use session.user.clanId

// ❌ WRONG
const data = await req.json();
await prisma.member.create({ data: { ...data } }); // clanId from user input!

// ✅ CORRECT
const { clanId } = await getTenantContext();
const data = await req.json();
await prisma.member.create({
  data: {
    fullName: data.fullName,
    gender: data.gender,
    // ... other validated fields
    clanId, // ← Always from session
  },
});
```

### Tables That Need Auto-Assignment
| Table | Field | Source |
|-------|-------|--------|
| `members` | `clan_id` | `session.user.clanId` |
| `grave_sites` | `clan_id` | `session.user.clanId` |
| `ritual_events` | `clan_id` | `session.user.clanId` |
| `duties` | `clan_id` | `session.user.clanId` |
| `audit_logs` | `clan_id` | `session.user.clanId` |

### DoD
- [ ] All create endpoints inject `clanId` from session
- [ ] No create endpoint accepts `clanId` from request body
- [ ] Tests verify auto-assignment

---

## Task 6: Cross-Tenant Prevention for Relationships

**ID:** `MT-006`  
**Output:** Extra validation on relationship APIs

### Steps

1. When creating parent-child relationships:
   ```typescript
   // POST /api/v1/relationships
   const { clanId } = await getTenantContext();

   // Fetch both members
   const [parent, child] = await Promise.all([
     prisma.member.findUnique({ where: { id: body.parentId } }),
     prisma.member.findUnique({ where: { id: body.childId } }),
   ]);

   // Verify BOTH belong to user's clan
   if (parent?.clanId !== clanId || child?.clanId !== clanId) {
     return Response.json({ error: "Invalid members" }, { status: 400 });
   }
   ```

2. When creating spouse relationships:
   ```typescript
   // Same pattern: verify both members in same clan
   ```

3. When assigning duties to members:
   ```typescript
   // Verify assigned member belongs to the same clan
   ```

### DoD
- [ ] Relationship creation validates both sides same clan
- [ ] Spouse pairing validates both sides same clan
- [ ] Duty assignment validates assignee same clan

---

## Task 7: Integration Tests

**ID:** `MT-007`  
**Output:** Test suite for tenant isolation

### Test Structure
```typescript
// tests/tenant-isolation.test.ts

describe("Multi-Tenant Isolation", () => {
  // Setup: Create 2 clans with users and members
  let clanA: { id, userId, memberId };
  let clanB: { id, userId, memberId };

  beforeAll(async () => {
    // Create Clan A with user + members
    // Create Clan B with user + members
  });

  test("User A cannot list Clan B members", async () => {
    // Login as User A
    // GET /api/v1/members
    // Assert: only Clan A members returned
  });

  test("User A cannot fetch Clan B member by ID", async () => {
    // Login as User A
    // GET /api/v1/members/{clanB.memberId}
    // Assert: 404 Not Found
  });

  test("User A cannot create member in Clan B", async () => {
    // Login as User A
    // POST /api/v1/members with clanId=clanB.id
    // Assert: created member has clanId=clanA.id (session overrides body)
  });

  test("User A cannot create cross-clan relationship", async () => {
    // Login as User A
    // POST /api/v1/relationships { parentId: clanA.member, childId: clanB.member }
    // Assert: 400 Bad Request
  });

  test("User A cannot access Clan B rituals", async () => {
    // Assert: 404 or empty list
  });

  test("User A cannot access Clan B duties", async () => {
    // Assert: 404 or empty list
  });

  test("User with no clan gets 403", async () => {
    // Create user without clan
    // Any API call → 403
  });
});
```

### DoD
- [ ] All 10 test cases from PRD-09 §6.1 pass
- [ ] Tests run in CI pipeline
- [ ] No cross-tenant data leak in any test

---

## Task Execution Order

```
Task 1 (Tenant Helpers)
  ↓
Task 2 (Refactor API Routes) ←── Can start after Task 1
  ↓
Task 3 (RLS Policies)        ←── Independent, can parallelize with Task 2
  ↓
Task 4 (RLS Session Var)     ←── After Task 3
  ↓
Task 5 (Auto-Assignment)     ←── After Task 2
  ↓
Task 6 (Cross-Tenant Checks) ←── After Task 2
  ↓
Task 7 (Integration Tests)   ←── After all above
```

---

## File Summary

| New / Modified File | Purpose |
|---------------------|---------|
| `src/lib/tenant.ts` | Tenant context + ownership helpers |
| `src/lib/api-helpers.ts` | API error handler |
| `src/lib/prisma-tenant.ts` | RLS session variable injection |
| `src/app/api/v1/members/route.ts` | Add tenant scoping |
| `src/app/api/v1/members/[id]/route.ts` | Add ownership check |
| `src/app/api/v1/relationships/route.ts` | Cross-clan prevention |
| `src/app/api/v1/rituals/route.ts` | Add tenant scoping |
| `src/app/api/v1/duties/route.ts` | Add tenant scoping |
| `src/app/api/v1/sites/route.ts` | Add tenant scoping |
| `prisma/migrations/xxx_add_rls_policies/migration.sql` | RLS policies |
| `tests/tenant-isolation.test.ts` | Integration tests |

---

## Dependencies

- No new npm packages required
- PostgreSQL 16+ (already using) — supports RLS natively
- Supabase already has RLS infrastructure available
