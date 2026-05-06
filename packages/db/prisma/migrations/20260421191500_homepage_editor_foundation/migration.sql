-- Homepage editor foundation (admin schema)

DO $$ BEGIN
  CREATE TYPE "admin"."HomepageAssetKind" AS ENUM ('BACKGROUND', 'OVERLAY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "admin"."HomepageConfigStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "admin"."homepage_assets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "kind" "admin"."HomepageAssetKind" NOT NULL DEFAULT 'OVERLAY',
  "file_name" VARCHAR(255) NOT NULL,
  "storage_key" VARCHAR(500) NOT NULL,
  "public_url" VARCHAR(1000) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "file_size" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "has_alpha" BOOLEAN,
  "uploaded_by" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "homepage_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "admin"."homepage_configs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "status" "admin"."HomepageConfigStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER,
  "name" VARCHAR(160) NOT NULL,
  "background_asset_id" UUID NOT NULL,
  "background_width" INTEGER NOT NULL,
  "background_height" INTEGER NOT NULL,
  "layers" JSONB NOT NULL,
  "created_by" UUID NOT NULL,
  "published_by" UUID,
  "published_at" TIMESTAMPTZ,
  "based_on_config_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "homepage_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "homepage_assets_storage_key_key"
ON "admin"."homepage_assets"("storage_key");

CREATE UNIQUE INDEX IF NOT EXISTS "homepage_configs_version_key"
ON "admin"."homepage_configs"("version");

CREATE INDEX IF NOT EXISTS "homepage_assets_kind_created_at_idx"
ON "admin"."homepage_assets"("kind", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "homepage_configs_status_updated_at_idx"
ON "admin"."homepage_configs"("status", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "homepage_configs_published_at_idx"
ON "admin"."homepage_configs"("published_at" DESC);
