# Heritage Cloud — V2 Database Schema Changes

> **Version:** 2.0  
> **Scope:** Authentication + Multi-Tenant Isolation DB changes  
> **Base Schema:** `v1/db-design/database-schema.md` (unchanged — V2 adds to it)  
> **Created:** 2026-03-03

---

## 1. Overview

V2 database changes are **additive** — no V1 tables are modified structurally. V2 adds:
1. New table: `password_reset_tokens` (for auth password recovery)
2. Row-Level Security (RLS) policies on all tenant-scoped tables
3. Helper function for RLS tenant context

---

## 2. New Table: `password_reset_tokens`

### 2.1 SQL Definition

```sql
CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,                   -- NULL if not yet used
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at)
  WHERE used_at IS NULL;  -- Partial index: only unused tokens
```

### 2.2 Prisma Model

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

### 2.3 User Model Addition

```prisma
model User {
  // ... all existing fields unchanged ...

  // ADD this relation:
  passwordResetTokens PasswordResetToken[]
}
```

### 2.4 Token Lifecycle

```
Token Created           Token Used/Expired          Token Cleaned
    │                        │                          │
    ▼                        ▼                          ▼
┌──────────┐          ┌──────────┐              ┌──────────┐
│ created_at│ ──1hr──▶│ expires_at│              │ DELETE    │
│ used_at=  │         │ or       │              │ WHERE     │
│   NULL    │         │ used_at  │              │ expires < │
└──────────┘         │ = now()  │              │ now()-30d │
                     └──────────┘              └──────────┘
```

**Cleanup (cron job / scheduled):**
```sql
-- Delete expired/used tokens older than 30 days
DELETE FROM password_reset_tokens
WHERE (expires_at < now() - INTERVAL '30 days')
   OR (used_at IS NOT NULL AND used_at < now() - INTERVAL '30 days');
```

---

## 3. Row-Level Security (RLS) Policies

### 3.1 Tenant Context Function

```sql
-- Function to get the current tenant (clan) ID from session variable
-- Set via: SET LOCAL app.current_clan_id = '<uuid>';
CREATE OR REPLACE FUNCTION current_clan_id() RETURNS uuid AS $$
  SELECT COALESCE(
    nullif(current_setting('app.current_clan_id', true), ''),
    '00000000-0000-0000-0000-000000000000'  -- Fallback: matches nothing
  )::uuid;
$$ LANGUAGE sql STABLE;
```

### 3.2 Tables with Direct `clan_id` Column

These tables have `clan_id` as a direct column — simple equality policy.

```sql
-- ─── members ───
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE members FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON members
  FOR ALL
  USING (clan_id = current_clan_id())
  WITH CHECK (clan_id = current_clan_id());

-- ─── grave_sites ───
ALTER TABLE grave_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE grave_sites FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON grave_sites
  FOR ALL
  USING (clan_id = current_clan_id())
  WITH CHECK (clan_id = current_clan_id());

-- ─── ritual_events ───
ALTER TABLE ritual_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ritual_events
  FOR ALL
  USING (clan_id = current_clan_id())
  WITH CHECK (clan_id = current_clan_id());

-- ─── duties ───
ALTER TABLE duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE duties FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON duties
  FOR ALL
  USING (clan_id = current_clan_id())
  WITH CHECK (clan_id = current_clan_id());

-- ─── audit_logs ───
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_logs
  FOR ALL
  USING (clan_id = current_clan_id())
  WITH CHECK (clan_id = current_clan_id());
```

### 3.3 Tables Scoped via Foreign Key (JOIN-based Policies)

These tables don't have a direct `clan_id` — they reference a tenant-scoped parent.

```sql
-- ─── relationships (scoped via members.clan_id) ───
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON relationships
  FOR ALL
  USING (
    parent_id IN (SELECT id FROM members WHERE clan_id = current_clan_id())
  );

-- ─── member_spouses (scoped via members.clan_id) ───
ALTER TABLE member_spouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_spouses FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON member_spouses
  FOR ALL
  USING (
    member_a_id IN (SELECT id FROM members WHERE clan_id = current_clan_id())
  );

-- ─── member_media (scoped via members.clan_id) ───
ALTER TABLE member_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_media FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON member_media
  FOR ALL
  USING (
    member_id IN (SELECT id FROM members WHERE clan_id = current_clan_id())
  );

-- ─── site_media (scoped via grave_sites.clan_id) ───
ALTER TABLE site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_media FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON site_media
  FOR ALL
  USING (
    site_id IN (SELECT id FROM grave_sites WHERE clan_id = current_clan_id())
  );

-- ─── ritual_instructions (scoped via ritual_events.clan_id) ───
ALTER TABLE ritual_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_instructions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ritual_instructions
  FOR ALL
  USING (
    ritual_id IN (SELECT id FROM ritual_events WHERE clan_id = current_clan_id())
  );

-- ─── ritual_duties (scoped via ritual_events.clan_id) ───
ALTER TABLE ritual_duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_duties FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ritual_duties
  FOR ALL
  USING (
    ritual_id IN (SELECT id FROM ritual_events WHERE clan_id = current_clan_id())
  );

-- ─── duty_logs (scoped via duties.clan_id) ───
ALTER TABLE duty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON duty_logs
  FOR ALL
  USING (
    duty_id IN (SELECT id FROM duties WHERE clan_id = current_clan_id())
  );

-- ─── virtual_offerings (scoped via members.clan_id) ───
ALTER TABLE virtual_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_offerings FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON virtual_offerings
  FOR ALL
  USING (
    member_id IN (SELECT id FROM members WHERE clan_id = current_clan_id())
  );

-- ─── notifications (scoped via users.clan_id) ───
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notifications
  FOR ALL
  USING (
    user_id IN (SELECT id FROM users WHERE clan_id = current_clan_id())
  );
```

### 3.4 Tables NOT Under RLS

| Table | Reason |
|-------|--------|
| `users` | Queried by email on login (cross-tenant by nature) — protected by app logic |
| `user_profiles` | Accessed via authenticated user's own record only |
| `clans` | Queried by ID (user's own clan) — protected by session |
| `password_reset_tokens` | System auth table, scoped by `user_id` at app level |

---

## 4. Performance Indexes for Tenant Isolation

The V1 schema already has `clan_id` indexes on major tables. Verify these exist:

```sql
-- Verify existing indexes (from V1)
-- These should already exist:
CREATE INDEX IF NOT EXISTS idx_members_clan ON members(clan_id);
CREATE INDEX IF NOT EXISTS idx_members_clan_generation ON members(clan_id, generation);
CREATE INDEX IF NOT EXISTS idx_members_deceased ON members(clan_id, is_deceased);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(clan_id, full_name);

-- Additional composite indexes for common tenant-scoped queries:
CREATE INDEX IF NOT EXISTS idx_duties_clan_status ON duties(clan_id, status);
CREATE INDEX IF NOT EXISTS idx_ritual_events_clan ON ritual_events(clan_id);
CREATE INDEX IF NOT EXISTS idx_grave_sites_clan ON grave_sites(clan_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clan ON audit_logs(clan_id);
```

---

## 5. Entity Relationship Diagram (V2 Additions)

```
                              V2 ADDITIONS
                    ┌─────────────────────────────┐
                    │                             │
┌─────────┐       │  ┌───────────────────────┐  │
│  users  │──1:N──┼──│ password_reset_tokens │  │
└─────────┘       │  └───────────────────────┘  │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │    RLS POLICIES       │  │
                    │  │  on 14 tables         │  │
                    │  │  (safety net layer)   │  │
                    │  └───────────────────────┘  │
                    │                             │
                    └─────────────────────────────┘

All V1 tables remain unchanged structurally.
The `clan_id` column on each table now serves double duty:
  1. Application-level query filter (primary)
  2. RLS policy enforcement (safety net)
```

---

## 6. Migration Steps

### Step 1: Add PasswordResetToken to Prisma
```bash
# Add model to prisma/schema.prisma
# Then run:
npx prisma migrate dev --name v2_password_reset_tokens
```

### Step 2: Apply RLS Policies
```bash
# Create manual migration for RLS:
npx prisma migrate dev --name v2_rls_policies --create-only
# Then paste RLS SQL into the generated migration file
# Then apply:
npx prisma migrate dev
```

### Step 3: Verify Indexes
```bash
# Run verification query:
SELECT tablename, indexname FROM pg_indexes
WHERE tablename IN ('members', 'duties', 'ritual_events', 'grave_sites', 'audit_logs')
ORDER BY tablename;
```

---

## 7. Rollback Plan

All V2 changes are additive and reversible:

```sql
-- Rollback RLS (if needed)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
-- Repeat for all tables...

-- Drop new table
DROP TABLE IF EXISTS password_reset_tokens;

-- Drop function
DROP FUNCTION IF EXISTS current_clan_id();
```
