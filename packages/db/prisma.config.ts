/**
 * Master Prisma configuration for the shared @gia-pha/db package.
 *
 * This is the single source of truth for:
 *  - Schema (prisma/schema.prisma)
 *  - Migrations (prisma/migrations/)
 *  - Seeds (prisma/seed/)
 *
 * Usage (from this directory):
 *   npm run db:migrate:dev   — create a new migration
 *   npm run db:migrate:deploy — apply migrations (production)
 *   npm run db:seed          — seed all data
 *   npm run db:seed:public   — seed public schema only
 *   npm run db:seed:admin    — seed admin schema only
 *   npm run db:studio        — open Prisma Studio
 *   npm run db:reset         — reset database (dev only!)
 */
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (dev override), then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses pgBouncer).
    // For Supabase: set DIRECT_URL = postgresql://postgres:...@db.<project>.supabase.co:5432/postgres
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
