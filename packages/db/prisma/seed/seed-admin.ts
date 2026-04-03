/**
 * seed-admin.ts
 * Seeds the admin schema: subscription tiers, admin users.
 * Based on the gia-pha-admin seed data.
 */
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export async function seedAdmin(prisma: PrismaClient) {
  console.log("\n🔐 Seeding admin schema...");

  // ── Subscription Tiers ────────────────────────────────────
  await prisma.subscriptionTier.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      slug: "free",
      nameVi: "Cơ Bản",
      nameEn: "Basic",
      descriptionVi: "Dành cho các dòng họ nhỏ",
      descriptionEn: "For small clans",
      priceMonthly: 0,
      priceYearly: 0,
      features: "[]",
      limits: "{}",
      badgeColor: "bg-gray-500",
      isActive: true,
      displayOrder: 0,
    },
  });
  console.log("  ✓ Free tier created");

  await prisma.subscriptionTier.upsert({
    where: { slug: "standard" },
    update: {},
    create: {
      slug: "standard",
      nameVi: "Tiêu Chuẩn",
      nameEn: "Standard",
      descriptionVi: "Dành cho các dòng họ trung bình",
      descriptionEn: "For medium-sized clans",
      priceMonthly: 99000,
      priceYearly: 990000,
      currency: "VND",
      features: "[]",
      limits: "{}",
      badgeColor: "bg-blue-500",
      isActive: true,
      displayOrder: 1,
    },
  });
  console.log("  ✓ Standard tier created");

  await prisma.subscriptionTier.upsert({
    where: { slug: "premium" },
    update: {},
    create: {
      slug: "premium",
      nameVi: "Cao Cấp",
      nameEn: "Premium",
      descriptionVi: "Dành cho các dòng họ lớn với đầy đủ tính năng",
      descriptionEn: "For large clans with all features",
      priceMonthly: 249000,
      priceYearly: 2490000,
      currency: "VND",
      features: "[]",
      limits: "{}",
      badgeColor: "bg-amber-500",
      isPopular: true,
      isActive: true,
      displayOrder: 2,
    },
  });
  console.log("  ✓ Premium tier created");

  // ── Admin User ────────────────────────────────────────────
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@heritagecloud.vn" },
    update: { passwordHash: hash },
    create: {
      email: "admin@heritagecloud.vn",
      passwordHash: hash,
      displayName: "System Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("  ✓ Admin user: admin@heritagecloud.vn");
}

// ── Standalone runner ─────────────────────────────────────────────────
if (require.main === module) {
  const directUrl = new URL(process.env.DIRECT_URL!);
  directUrl.searchParams.delete("sslmode");
  const pool = new Pool({ connectionString: directUrl.toString(), ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  seedAdmin(prisma)
    .then(() => console.log("\n✅ Admin seed complete!"))
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
