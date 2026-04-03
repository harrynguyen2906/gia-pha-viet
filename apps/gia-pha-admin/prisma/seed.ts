/**
 * @deprecated This seed file is superseded by the centralized seed in packages/db.
 *
 * Use from the repo root or gia-pha-admin/ instead:
 *   npm run db:seed:admin   — seeds subscription tiers + admin user
 *   npm run db:seed         — seeds everything (public + admin)
 *
 * This file is kept for reference only.
 */
import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Seeding initial admin data...')

  // Seed default tiers
  await prisma.subscriptionTier.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      slug: 'free',
      nameVi: 'Cơ Bản',
      nameEn: 'Basic',
      descriptionVi: 'Dành cho các dòng họ nhỏ',
      descriptionEn: 'For small clans',
      priceMonthly: 0,
      priceYearly: 0,
      features: "[]",
      limits: "{}",
      badgeColor: 'bg-gray-500',
      isActive: true,
    }
  })

  const hash = await bcrypt.hash('admin123', 10)
  // Seed Admin user
  await prisma.adminUser.upsert({
    where: { email: 'admin@heritagecloud.vn' },
    update: { passwordHash: hash },
    create: {
      email: 'admin@heritagecloud.vn',
      passwordHash: hash,
      displayName: 'System Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
