/**
 * seed/index.ts
 * Master seed orchestrator — runs all seeds in order.
 *
 * Usage:
 *   npm run db:seed           — runs both seeds
 *   npm run db:seed:public    — public schema only
 *   npm run db:seed:admin     — admin schema only
 */
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { seedPublic } from "./seed-public";
import { seedAdmin } from "./seed-admin";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  console.log("🌱 Heritage Cloud — Database Seeding");
  console.log("═".repeat(40));

  // Create a single shared PrismaClient for all seeds
  const directUrl = new URL(process.env.DIRECT_URL!);
  directUrl.searchParams.delete("sslmode");
  const pool = new Pool({
    connectionString: directUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Seed public schema first (users, clans, members, etc.)
    await seedPublic(prisma);

    // 2. Seed admin schema (subscription tiers, admin users)
    await seedAdmin(prisma);

    console.log("\n" + "═".repeat(40));
    console.log("✅ All seeds complete!\n");
    console.log("App credentials:");
    console.log("  Heritage Web:");
    console.log("    Admin:  admin@heritage.local / heritage2025!");
    console.log("    Editor: editor@heritage.local / editor2025!");
    console.log("  Admin Dashboard:");
    console.log("    Admin:  admin@heritagecloud.vn / admin123");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
