-- Migration: v4_admin_schema_baseline
-- Baseline migration that records the admin schema as it already exists in the
-- database. All tables were created manually before Prisma migration tracking
-- was established on the admin schema.
--
-- This migration is intentionally a NO-OP — all objects already exist.
-- It is recorded here purely so Prisma's migration history reflects reality.
-- Applied via: prisma migrate resolve --applied

-- admin schema creation (already exists)
CREATE SCHEMA IF NOT EXISTS "admin";

-- Enums (already exist in admin schema)
DO $$ BEGIN
  CREATE TYPE "admin"."SubscriptionStatus" AS ENUM ('ACTIVE','PAST_DUE','CANCELLED','EXPIRED','TRIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "admin"."BillingCycle" AS ENUM ('MONTHLY','YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "admin"."OrderStatus" AS ENUM ('PENDING','COMPLETED','FAILED','REFUNDED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "admin"."CancellationType" AS ENUM ('END_OF_PERIOD','IMMEDIATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "admin"."CancellationReason" AS ENUM ('TOO_EXPENSIVE','NOT_USEFUL','SWITCHING_PRODUCT','TECHNICAL_ISSUES','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "admin"."AdminRole" AS ENUM ('SUPER_ADMIN','SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables (already exist — IF NOT EXISTS guards are safe no-ops)
CREATE TABLE IF NOT EXISTS "admin"."subscription_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(50) NOT NULL,
    "name_vi" VARCHAR(200) NOT NULL,
    "name_en" VARCHAR(200) NOT NULL,
    "description_vi" TEXT,
    "description_en" TEXT,
    "price_monthly" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "price_yearly" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "features" JSONB NOT NULL DEFAULT '[]',
    "limits" JSONB NOT NULL DEFAULT '{}',
    "badge_color" VARCHAR(20),
    "badge_icon" VARCHAR(50),
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "subscription_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin"."user_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "clan_id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "status" "admin"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "cancelled_at" TIMESTAMPTZ,
    "cancellation_reason" TEXT,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "trial_ends_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin"."orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number" VARCHAR(50) NOT NULL,
    "user_id" UUID NOT NULL,
    "clan_id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "billing_cycle" "admin"."BillingCycle" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "status" "admin"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" VARCHAR(100),
    "payment_reference" VARCHAR(255),
    "paid_at" TIMESTAMPTZ,
    "refunded_at" TIMESTAMPTZ,
    "refund_amount" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin"."order_billing_info" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "address_line_1" VARCHAR(255),
    "address_line_2" VARCHAR(255),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "ward" VARCHAR(100),
    "tax_id" VARCHAR(50),
    "company_name" VARCHAR(200),
    CONSTRAINT "order_billing_info_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin"."cancellation_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID NOT NULL,
    "cancellation_type" "admin"."CancellationType" NOT NULL,
    "cancellation_reason" "admin"."CancellationReason" NOT NULL,
    "cancellation_feedback" TEXT,
    "retention_offered" BOOLEAN NOT NULL DEFAULT false,
    "retention_accepted" BOOLEAN,
    "processed_by" UUID,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "cancellation_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin"."admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "role" "admin"."AdminRole" NOT NULL DEFAULT 'SUPPORT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin"."admin_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);
