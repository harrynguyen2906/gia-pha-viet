-- Supabase migration: v2_rls_policies
-- Enables Row-Level Security and creates tenant isolation policies for all
-- clan-scoped tables.  The helper function current_clan_id() reads the clan
-- ID that the application embeds in the JWT (app_metadata.clan_id) so that
-- every query is automatically filtered to the authenticated tenant.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: current_clan_id()
-- Extracts clan_id from the Supabase JWT app_metadata claim.
-- Called by every RLS policy below.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_clan_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'clan_id'),
    ''
  )::UUID;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: is_service_role()
-- Returns true when the request is made from a privileged service-role key,
-- which bypasses all tenant restrictions (used for admin/seed operations).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role';
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on all tenant-scoped tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_spouses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_media         ENABLE ROW LEVEL SECURITY;
ALTER TABLE grave_sites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_media           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_instructions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_duties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE duties               ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_offerings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- members — direct clan_id column
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_members" ON members;
CREATE POLICY "tenant_isolation_members" ON members
    AS PERMISSIVE FOR ALL
    USING (is_service_role() OR clan_id = current_clan_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- relationships — join through members table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_relationships" ON relationships;
CREATE POLICY "tenant_isolation_relationships" ON relationships
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = relationships.parent_id
              AND m.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- member_spouses — join through members table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_member_spouses" ON member_spouses;
CREATE POLICY "tenant_isolation_member_spouses" ON member_spouses
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = member_spouses.member_a_id
              AND m.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- member_media — join through members table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_member_media" ON member_media;
CREATE POLICY "tenant_isolation_member_media" ON member_media
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = member_media.member_id
              AND m.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- grave_sites — direct clan_id column
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_grave_sites" ON grave_sites;
CREATE POLICY "tenant_isolation_grave_sites" ON grave_sites
    AS PERMISSIVE FOR ALL
    USING (is_service_role() OR clan_id = current_clan_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- site_media — join through grave_sites table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_site_media" ON site_media;
CREATE POLICY "tenant_isolation_site_media" ON site_media
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM grave_sites gs
            WHERE gs.id = site_media.site_id
              AND gs.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- ritual_events — direct clan_id column
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_ritual_events" ON ritual_events;
CREATE POLICY "tenant_isolation_ritual_events" ON ritual_events
    AS PERMISSIVE FOR ALL
    USING (is_service_role() OR clan_id = current_clan_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- ritual_instructions — join through ritual_events table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_ritual_instructions" ON ritual_instructions;
CREATE POLICY "tenant_isolation_ritual_instructions" ON ritual_instructions
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM ritual_events re
            WHERE re.id = ritual_instructions.ritual_event_id
              AND re.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- ritual_duties — join through ritual_events table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_ritual_duties" ON ritual_duties;
CREATE POLICY "tenant_isolation_ritual_duties" ON ritual_duties
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM ritual_events re
            WHERE re.id = ritual_duties.ritual_event_id
              AND re.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- duties — direct clan_id column
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_duties" ON duties;
CREATE POLICY "tenant_isolation_duties" ON duties
    AS PERMISSIVE FOR ALL
    USING (is_service_role() OR clan_id = current_clan_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- duty_logs — join through duties table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_duty_logs" ON duty_logs;
CREATE POLICY "tenant_isolation_duty_logs" ON duty_logs
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM duties d
            WHERE d.id = duty_logs.duty_id
              AND d.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- virtual_offerings — join through members table
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_virtual_offerings" ON virtual_offerings;
CREATE POLICY "tenant_isolation_virtual_offerings" ON virtual_offerings
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM members m
            WHERE m.id = virtual_offerings.member_id
              AND m.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- notifications — join through users → clan_id
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_notifications" ON notifications;
CREATE POLICY "tenant_isolation_notifications" ON notifications
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = notifications.user_id
              AND u.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- audit_logs — nullable clan_id, fall back to user's clan
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_audit_logs" ON audit_logs;
CREATE POLICY "tenant_isolation_audit_logs" ON audit_logs
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        audit_logs.clan_id = current_clan_id() OR
        (
            audit_logs.clan_id IS NULL AND
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = audit_logs.user_id
                  AND u.clan_id = current_clan_id()
            )
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- password_reset_tokens — user can only see their own tokens
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_isolation_password_reset_tokens" ON password_reset_tokens;
CREATE POLICY "tenant_isolation_password_reset_tokens" ON password_reset_tokens
    AS PERMISSIVE FOR ALL
    USING (
        is_service_role() OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = password_reset_tokens.user_id
              AND u.clan_id = current_clan_id()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- Additional composite indexes for RLS query performance
-- These support the EXISTS sub-queries in policies above.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_ritual_instructions_event_clan"
    ON ritual_instructions(ritual_event_id);

CREATE INDEX IF NOT EXISTS "idx_ritual_duties_event_clan"
    ON ritual_duties(ritual_event_id);

CREATE INDEX IF NOT EXISTS "idx_duty_logs_duty_clan"
    ON duty_logs(duty_id);

CREATE INDEX IF NOT EXISTS "idx_virtual_offerings_member_clan"
    ON virtual_offerings(member_id);

CREATE INDEX IF NOT EXISTS "idx_site_media_site_clan"
    ON site_media(site_id);

CREATE INDEX IF NOT EXISTS "idx_notifications_user_clan"
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_clan"
    ON audit_logs(user_id) WHERE user_id IS NOT NULL;
