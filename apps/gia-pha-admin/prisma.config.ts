/**
 * Local Prisma config for gia-pha-admin.
 *
 * ⚠️  DO NOT run migrations from this directory.
 *     Migrations are managed centrally from packages/db.
 *     Use these commands from repo root or gia-pha-admin/:
 *       npm run db:migrate:status   — check pending migrations
 *       npm run db:migrate:deploy   — apply migrations (production)
 *       npm run db:migrate:dev      — create a new migration (dev)
 *       npm run db:studio           — open Prisma Studio
 *
 * This config is used ONLY for local `prisma generate`.
 */
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  // No migrations block — managed by packages/db
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
