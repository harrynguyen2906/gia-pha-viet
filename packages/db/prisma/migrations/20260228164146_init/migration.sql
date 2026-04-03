-- CreateEnum
CREATE TYPE "GenderType" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "LineageRole" AS ENUM ('HEAD_OF_HOUSE', 'ELDER', 'HEIR', 'YOUTH', 'MEMBER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HEAD_OF_HOUSE', 'ELDER', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('BIOLOGICAL', 'ADOPTED', 'STEP');

-- CreateEnum
CREATE TYPE "SiteCondition" AS ENUM ('MAINTAINED', 'NEEDS_VISIT', 'WEATHERED', 'RESTORATION');

-- CreateEnum
CREATE TYPE "SiteType" AS ENUM ('TEMPLE', 'CHURCH', 'CEMETERY', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DutyCategory" AS ENUM ('RELIGIOUS', 'MAINTENANCE', 'ARCHIVAL', 'SOCIAL');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('QUEUE', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DutyPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AssignedGroup" AS ENUM ('ELDERS', 'HEIRS', 'YOUTH', 'ALL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('AVATAR', 'PHOTO', 'PANORAMA', 'DOCUMENT', 'MODEL_3D');

-- CreateEnum
CREATE TYPE "OfferingType" AS ENUM ('INCENSE', 'FLOWERS', 'FOOD', 'PRAYER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RITUAL_REMINDER', 'DUTY_ASSIGNED', 'DUTY_DUE', 'DUTY_COMPLETED', 'MEMBER_ADDED', 'SITE_REGISTERED', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "provider" VARCHAR(50),
    "provider_id" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'GUEST',
    "clan_id" UUID,
    "member_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "phone" VARCHAR(20),
    "locale" VARCHAR(10) NOT NULL DEFAULT 'vi',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "display_name" VARCHAR(200),
    "motto" TEXT,
    "founding_year" INTEGER,
    "description" TEXT,
    "banner_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "head_of_house_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "clans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clan_id" UUID NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "gender" "GenderType" NOT NULL DEFAULT 'MALE',
    "is_deceased" BOOLEAN NOT NULL DEFAULT false,
    "birth_date_solar" DATE,
    "birth_date_lunar" VARCHAR(50),
    "death_date_solar" DATE,
    "death_date_lunar" VARCHAR(50),
    "departure_rite" TEXT,
    "avatar_url" TEXT,
    "biography" TEXT,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "lineage_role" "LineageRole" NOT NULL DEFAULT 'MEMBER',
    "branch_name" VARCHAR(100),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "relationship_type" "RelationshipType" NOT NULL DEFAULT 'BIOLOGICAL',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_spouses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_a_id" UUID NOT NULL,
    "member_b_id" UUID NOT NULL,
    "marriage_date" DATE,
    "divorce_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_spouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "file_size" INTEGER,
    "mime_type" VARCHAR(100),
    "width" INTEGER,
    "height" INTEGER,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grave_sites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "clan_id" UUID NOT NULL,
    "section_plot" VARCHAR(200),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "epitaph" TEXT,
    "condition" "SiteCondition" NOT NULL DEFAULT 'MAINTAINED',
    "site_type" "SiteType" NOT NULL DEFAULT 'CEMETERY',
    "last_visited" DATE,
    "registered_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "grave_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_id" UUID NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "file_size" INTEGER,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ritual_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clan_id" UUID NOT NULL,
    "ancestor_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "date_solar" DATE NOT NULL,
    "date_lunar" VARCHAR(50),
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "lunar_recurrence" VARCHAR(50),
    "is_certified" BOOLEAN NOT NULL DEFAULT false,
    "certified_by" UUID,
    "certified_at" TIMESTAMPTZ,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "ritual_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ritual_instructions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ritual_event_id" UUID NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ritual_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ritual_duties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ritual_event_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "assigned_group" "AssignedGroup" NOT NULL DEFAULT 'ALL',
    "assigned_to" UUID,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ritual_duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clan_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "category" "DutyCategory" NOT NULL,
    "status" "DutyStatus" NOT NULL DEFAULT 'QUEUE',
    "priority" "DutyPriority" NOT NULL DEFAULT 'MEDIUM',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "assigned_to" UUID,
    "assigned_by" UUID,
    "ritual_event_id" UUID,
    "due_date" DATE,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "duty_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "old_value" VARCHAR(100),
    "new_value" VARCHAR(100),
    "performed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duty_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_offerings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "offered_by" UUID NOT NULL,
    "offering_type" "OfferingType" NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "virtual_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "body" TEXT,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "clan_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_clan_id_idx" ON "users"("clan_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "clans_name_idx" ON "clans"("name");

-- CreateIndex
CREATE INDEX "members_clan_id_idx" ON "members"("clan_id");

-- CreateIndex
CREATE INDEX "members_clan_id_generation_idx" ON "members"("clan_id", "generation");

-- CreateIndex
CREATE INDEX "members_clan_id_is_deceased_idx" ON "members"("clan_id", "is_deceased");

-- CreateIndex
CREATE INDEX "members_clan_id_full_name_idx" ON "members"("clan_id", "full_name");

-- CreateIndex
CREATE INDEX "relationships_parent_id_idx" ON "relationships"("parent_id");

-- CreateIndex
CREATE INDEX "relationships_child_id_idx" ON "relationships"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_parent_id_child_id_key" ON "relationships"("parent_id", "child_id");

-- CreateIndex
CREATE INDEX "member_spouses_member_a_id_idx" ON "member_spouses"("member_a_id");

-- CreateIndex
CREATE INDEX "member_spouses_member_b_id_idx" ON "member_spouses"("member_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_spouses_member_a_id_member_b_id_key" ON "member_spouses"("member_a_id", "member_b_id");

-- CreateIndex
CREATE INDEX "member_media_member_id_media_type_idx" ON "member_media"("member_id", "media_type");

-- CreateIndex
CREATE UNIQUE INDEX "grave_sites_member_id_key" ON "grave_sites"("member_id");

-- CreateIndex
CREATE INDEX "grave_sites_clan_id_idx" ON "grave_sites"("clan_id");

-- CreateIndex
CREATE INDEX "grave_sites_member_id_idx" ON "grave_sites"("member_id");

-- CreateIndex
CREATE INDEX "grave_sites_clan_id_condition_idx" ON "grave_sites"("clan_id", "condition");

-- CreateIndex
CREATE INDEX "site_media_site_id_media_type_idx" ON "site_media"("site_id", "media_type");

-- CreateIndex
CREATE INDEX "ritual_events_clan_id_idx" ON "ritual_events"("clan_id");

-- CreateIndex
CREATE INDEX "ritual_events_clan_id_date_solar_idx" ON "ritual_events"("clan_id", "date_solar");

-- CreateIndex
CREATE INDEX "ritual_events_ancestor_id_idx" ON "ritual_events"("ancestor_id");

-- CreateIndex
CREATE INDEX "ritual_instructions_ritual_event_id_sort_order_idx" ON "ritual_instructions"("ritual_event_id", "sort_order");

-- CreateIndex
CREATE INDEX "ritual_duties_ritual_event_id_idx" ON "ritual_duties"("ritual_event_id");

-- CreateIndex
CREATE INDEX "duties_clan_id_idx" ON "duties"("clan_id");

-- CreateIndex
CREATE INDEX "duties_clan_id_status_idx" ON "duties"("clan_id", "status");

-- CreateIndex
CREATE INDEX "duties_assigned_to_idx" ON "duties"("assigned_to");

-- CreateIndex
CREATE INDEX "duties_ritual_event_id_idx" ON "duties"("ritual_event_id");

-- CreateIndex
CREATE INDEX "duty_logs_duty_id_created_at_idx" ON "duty_logs"("duty_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "virtual_offerings_member_id_idx" ON "virtual_offerings"("member_id");

-- CreateIndex
CREATE INDEX "virtual_offerings_offered_by_idx" ON "virtual_offerings"("offered_by");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_clan_id_created_at_idx" ON "audit_logs"("clan_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clans" ADD CONSTRAINT "clans_head_of_house_id_fkey" FOREIGN KEY ("head_of_house_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_spouses" ADD CONSTRAINT "member_spouses_member_a_id_fkey" FOREIGN KEY ("member_a_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_spouses" ADD CONSTRAINT "member_spouses_member_b_id_fkey" FOREIGN KEY ("member_b_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_media" ADD CONSTRAINT "member_media_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grave_sites" ADD CONSTRAINT "grave_sites_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grave_sites" ADD CONSTRAINT "grave_sites_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_media" ADD CONSTRAINT "site_media_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "grave_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_events" ADD CONSTRAINT "ritual_events_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_events" ADD CONSTRAINT "ritual_events_ancestor_id_fkey" FOREIGN KEY ("ancestor_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_instructions" ADD CONSTRAINT "ritual_instructions_ritual_event_id_fkey" FOREIGN KEY ("ritual_event_id") REFERENCES "ritual_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_duties" ADD CONSTRAINT "ritual_duties_ritual_event_id_fkey" FOREIGN KEY ("ritual_event_id") REFERENCES "ritual_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ritual_duties" ADD CONSTRAINT "ritual_duties_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duties" ADD CONSTRAINT "duties_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duties" ADD CONSTRAINT "duties_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duties" ADD CONSTRAINT "duties_ritual_event_id_fkey" FOREIGN KEY ("ritual_event_id") REFERENCES "ritual_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_logs" ADD CONSTRAINT "duty_logs_duty_id_fkey" FOREIGN KEY ("duty_id") REFERENCES "duties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_offerings" ADD CONSTRAINT "virtual_offerings_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
