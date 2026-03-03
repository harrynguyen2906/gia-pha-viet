-- Supabase migration: v2_password_reset_tokens
-- Adds the password_reset_tokens table for credential-based password reset

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "password_reset_tokens_token_key" UNIQUE ("token"),
    CONSTRAINT "password_reset_tokens_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx"
    ON "password_reset_tokens"("token");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx"
    ON "password_reset_tokens"("user_id");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_idx"
    ON "password_reset_tokens"("expires_at") WHERE "used_at" IS NULL;
