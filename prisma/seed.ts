import { PrismaClient, GenderType, UserRole, LineageRole, SiteCondition, SiteType, DutyCategory, DutyPriority, DutyStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Heritage Cloud...");

  // ── Clan ──────────────────────────────────────────────────
  const clan = await prisma.clan.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Họ Nguyễn Văn",
      displayName: "Gia tộc Nguyễn Văn",
      foundingYear: 1750,
      motto: "Tổ tiên lưu đức, con cháu noi theo",
      description: "Dòng họ Nguyễn Văn từ làng Bình An, Quảng Ngãi, trải qua 5 đời khai phá vùng đất miền Trung.",
      isPublic: true,
    },
  });
  console.log("✓ Clan:", clan.name);

  // ── Admin User ────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("heritage2025!", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@heritage.local" },
    update: {},
    create: {
      email: "admin@heritage.local",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      clanId: clan.id,
      profile: {
        create: {
          displayName: "Admin Họ Nguyễn",
        },
      },
    },
  });
  console.log("✓ Admin:", adminUser.email);

  // ── Editor User ───────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "editor@heritage.local" },
    update: {},
    create: {
      email: "editor@heritage.local",
      passwordHash: await bcrypt.hash("editor2025!", 12),
      role: UserRole.ELDER,
      clanId: clan.id,
      profile: {
        create: { displayName: "Biên Soạn Viên" },
      },
    },
  });

  // ── Generation 1 ──────────────────────────────────────────
  const ancestor1 = await prisma.member.upsert({
    where: { id: "10000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000001",
      clanId: clan.id,
      fullName: "Nguyễn Văn Tổ",
      generation: 1,
      birthDateSolar: new Date("1750-01-01"),
      deathDateSolar: new Date("1820-01-01"),
      isDeceased: true,
      gender: GenderType.MALE,
      lineageRole: LineageRole.HEAD_OF_HOUSE,
      biography: "Nguyễn Văn Tổ là người đầu tiên khai khẩn đất tại làng Bình An, Quảng Ngãi.",
    },
  });

  const ancestor1Wife = await prisma.member.upsert({
    where: { id: "10000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000002",
      clanId: clan.id,
      fullName: "Trần Thị Tổ",
      generation: 1,
      birthDateSolar: new Date("1755-01-01"),
      deathDateSolar: new Date("1825-01-01"),
      isDeceased: true,
      gender: GenderType.FEMALE,
      lineageRole: LineageRole.ELDER,
    },
  });

  // Spouse link g1
  await prisma.memberSpouse.upsert({
    where: { memberAId_memberBId: { memberAId: ancestor1.id, memberBId: ancestor1Wife.id } },
    update: {},
    create: { memberAId: ancestor1.id, memberBId: ancestor1Wife.id },
  });

  // ── Generation 2 ──────────────────────────────────────────
  const g2Members = await Promise.all([
    prisma.member.upsert({
      where: { id: "20000000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "20000000-0000-0000-0000-000000000001",
        clanId: clan.id,
        fullName: "Nguyễn Văn Long",
        generation: 2,
        birthDateSolar: new Date("1780-01-01"),
        deathDateSolar: new Date("1855-01-01"),
        isDeceased: true,
        gender: GenderType.MALE,
        lineageRole: LineageRole.HEAD_OF_HOUSE,
      },
    }),
    prisma.member.upsert({
      where: { id: "20000000-0000-0000-0000-000000000002" },
      update: {},
      create: {
        id: "20000000-0000-0000-0000-000000000002",
        clanId: clan.id,
        fullName: "Nguyễn Văn Phước",
        generation: 2,
        birthDateSolar: new Date("1785-01-01"),
        deathDateSolar: new Date("1860-01-01"),
        isDeceased: true,
        gender: GenderType.MALE,
        lineageRole: LineageRole.MEMBER,
      },
    }),
    prisma.member.upsert({
      where: { id: "20000000-0000-0000-0000-000000000003" },
      update: {},
      create: {
        id: "20000000-0000-0000-0000-000000000003",
        clanId: clan.id,
        fullName: "Nguyễn Thị Hoa",
        generation: 2,
        birthDateSolar: new Date("1790-01-01"),
        deathDateSolar: new Date("1850-01-01"),
        isDeceased: true,
        gender: GenderType.FEMALE,
        lineageRole: LineageRole.MEMBER,
      },
    }),
  ]);

  // g2 parent links
  for (const m of g2Members) {
    await prisma.relationship.upsert({
      where: { parentId_childId: { parentId: ancestor1.id, childId: m.id } },
      update: {},
      create: { parentId: ancestor1.id, childId: m.id },
    });
  }

  // ── Generation 3 ──────────────────────────────────────────
  const g3a = await prisma.member.upsert({
    where: { id: "30000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "30000000-0000-0000-0000-000000000001",
      clanId: clan.id,
      fullName: "Nguyễn Văn Đức",
      generation: 3,
      birthDateSolar: new Date("1810-01-01"),
      deathDateSolar: new Date("1890-01-01"),
      isDeceased: true,
      gender: GenderType.MALE,
      lineageRole: LineageRole.ELDER,
    },
  });

  const g3b = await prisma.member.upsert({
    where: { id: "30000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "30000000-0000-0000-0000-000000000002",
      clanId: clan.id,
      fullName: "Nguyễn Văn Minh",
      generation: 3,
      birthDateSolar: new Date("1815-01-01"),
      deathDateSolar: new Date("1895-01-01"),
      isDeceased: true,
      gender: GenderType.MALE,
      lineageRole: LineageRole.MEMBER,
    },
  });

  await prisma.relationship.upsert({
    where: { parentId_childId: { parentId: g2Members[0].id, childId: g3a.id } },
    update: {},
    create: { parentId: g2Members[0].id, childId: g3a.id },
  });
  await prisma.relationship.upsert({
    where: { parentId_childId: { parentId: g2Members[0].id, childId: g3b.id } },
    update: {},
    create: { parentId: g2Members[0].id, childId: g3b.id },
  });

  // ── Generation 4 ──────────────────────────────────────────
  const g4Members = await Promise.all([
    prisma.member.upsert({
      where: { id: "40000000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "40000000-0000-0000-0000-000000000001",
        clanId: clan.id,
        fullName: "Nguyễn Văn Thành",
        generation: 4,
        birthDateSolar: new Date("1845-01-01"),
        deathDateSolar: new Date("1920-01-01"),
        isDeceased: true,
        gender: GenderType.MALE,
        lineageRole: LineageRole.ELDER,
      },
    }),
    prisma.member.upsert({
      where: { id: "40000000-0000-0000-0000-000000000002" },
      update: {},
      create: {
        id: "40000000-0000-0000-0000-000000000002",
        clanId: clan.id,
        fullName: "Nguyễn Văn Tâm",
        generation: 4,
        birthDateSolar: new Date("1850-01-01"),
        deathDateSolar: new Date("1930-01-01"),
        isDeceased: true,
        gender: GenderType.MALE,
        lineageRole: LineageRole.MEMBER,
      },
    }),
    prisma.member.upsert({
      where: { id: "40000000-0000-0000-0000-000000000003" },
      update: {},
      create: {
        id: "40000000-0000-0000-0000-000000000003",
        clanId: clan.id,
        fullName: "Nguyễn Thị Lan",
        generation: 4,
        birthDateSolar: new Date("1855-01-01"),
        deathDateSolar: new Date("1925-01-01"),
        isDeceased: true,
        gender: GenderType.FEMALE,
        lineageRole: LineageRole.MEMBER,
      },
    }),
  ]);

  for (const m of g4Members) {
    await prisma.relationship.upsert({
      where: { parentId_childId: { parentId: g3a.id, childId: m.id } },
      update: {},
      create: { parentId: g3a.id, childId: m.id },
    });
  }

  // ── Generation 5 (living) ─────────────────────────────────
  const g5Members = await Promise.all([
    prisma.member.upsert({
      where: { id: "50000000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "50000000-0000-0000-0000-000000000001",
        clanId: clan.id,
        fullName: "Nguyễn Văn An",
        generation: 5,
        birthDateSolar: new Date("1950-03-15"),
        isDeceased: false,
        gender: GenderType.MALE,
        lineageRole: LineageRole.HEAD_OF_HOUSE,
        biography: "Ông Nguyễn Văn An là trưởng tộc hiện tại, sinh sống tại TP. Hồ Chí Minh.",
      },
    }),
    prisma.member.upsert({
      where: { id: "50000000-0000-0000-0000-000000000002" },
      update: {},
      create: {
        id: "50000000-0000-0000-0000-000000000002",
        clanId: clan.id,
        fullName: "Nguyễn Văn Bình",
        generation: 5,
        birthDateSolar: new Date("1955-06-20"),
        isDeceased: false,
        gender: GenderType.MALE,
        lineageRole: LineageRole.MEMBER,
      },
    }),
    prisma.member.upsert({
      where: { id: "50000000-0000-0000-0000-000000000003" },
      update: {},
      create: {
        id: "50000000-0000-0000-0000-000000000003",
        clanId: clan.id,
        fullName: "Nguyễn Thị Mai",
        generation: 5,
        birthDateSolar: new Date("1958-09-10"),
        isDeceased: false,
        gender: GenderType.FEMALE,
        lineageRole: LineageRole.MEMBER,
      },
    }),
    prisma.member.upsert({
      where: { id: "50000000-0000-0000-0000-000000000004" },
      update: {},
      create: {
        id: "50000000-0000-0000-0000-000000000004",
        clanId: clan.id,
        fullName: "Nguyễn Văn Hải",
        generation: 5,
        birthDateSolar: new Date("1962-12-01"),
        isDeceased: false,
        gender: GenderType.MALE,
        lineageRole: LineageRole.MEMBER,
      },
    }),
  ]);

  for (const m of g5Members) {
    await prisma.relationship.upsert({
      where: { parentId_childId: { parentId: g4Members[0].id, childId: m.id } },
      update: {},
      create: { parentId: g4Members[0].id, childId: m.id },
    });
  }
  console.log("✓ 5 generations of members seeded");

  await prisma.clan.update({
    where: { id: clan.id },
    data: { headOfHouseId: g5Members[0].id },
  });

  // ── Grave Sites ───────────────────────────────────────────
  const site1 = await prisma.graveSite.upsert({
    where: { id: "a0000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "a0000000-0000-0000-0000-000000000001",
      clanId: clan.id,
      memberId: ancestor1.id,
      sectionPlot: "Gò Đất Cao, Làng Bình An, Quảng Ngãi",
      latitude: 15.1214,
      longitude: 108.7922,
      condition: SiteCondition.RESTORATION,
      siteType: SiteType.CEMETERY,
      epitaph: "Nơi yên nghỉ của Cụ Tổ Nguyễn Văn Tổ",
    },
  });

  await prisma.graveSite.upsert({
    where: { id: "a0000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "a0000000-0000-0000-0000-000000000002",
      clanId: clan.id,
      memberId: g2Members[0].id,
      sectionPlot: "Bên trái khuôn viên gia tộc, Quảng Ngãi",
      latitude: 15.1220,
      longitude: 108.7930,
      condition: SiteCondition.MAINTAINED,
      siteType: SiteType.CEMETERY,
    },
  });

  const site3 = await prisma.graveSite.upsert({
    where: { id: "a0000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "a0000000-0000-0000-0000-000000000003",
      clanId: clan.id,
      memberId: g4Members[0].id,
      sectionPlot: "Nghĩa trang thôn, Bình Sơn, Quảng Ngãi",
      latitude: 15.2100,
      longitude: 108.8500,
      condition: SiteCondition.WEATHERED,
      siteType: SiteType.CEMETERY,
      epitaph: "Mộ bị nghiêng sau đợt lũ năm 2020, cần trùng tu.",
    },
  });
  console.log("✓ 3 grave sites seeded");

  // ── Rituals ───────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const rituals = await Promise.all([
    prisma.ritualEvent.upsert({
      where: { id: "b0000000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "b0000000-0000-0000-0000-000000000001",
        clanId: clan.id,
        ancestorId: ancestor1.id,
        title: "Giỗ Tổ Nguyễn Văn Tổ",
        dateSolar: new Date(`${currentYear}-03-15`),
        dateLunar: "15/02 âm lịch",
        isRecurring: true,
        lunarRecurrence: "Mùng 15 tháng 2 âm lịch hàng năm",
        description: "Lễ giỗ lớn nhất của dòng họ, tưởng nhớ cụ tổ sáng lập.",
        isCertified: true,
        certifiedBy: adminUser.id,
        certifiedAt: new Date(),
        createdBy: adminUser.id,
      },
    }),
    prisma.ritualEvent.upsert({
      where: { id: "b0000000-0000-0000-0000-000000000002" },
      update: {},
      create: {
        id: "b0000000-0000-0000-0000-000000000002",
        clanId: clan.id,
        ancestorId: g2Members[0].id,
        title: "Giỗ Nguyễn Văn Long",
        dateSolar: new Date(`${currentYear}-06-20`),
        dateLunar: "20/05 âm lịch",
        isRecurring: true,
        isCertified: false,
        createdBy: adminUser.id,
      },
    }),
    prisma.ritualEvent.upsert({
      where: { id: "b0000000-0000-0000-0000-000000000003" },
      update: {},
      create: {
        id: "b0000000-0000-0000-0000-000000000003",
        clanId: clan.id,
        ancestorId: g3a.id,
        title: "Giỗ Nguyễn Văn Đức",
        dateSolar: new Date(`${currentYear}-09-10`),
        dateLunar: "10/08 âm lịch",
        isRecurring: true,
        isCertified: false,
        createdBy: adminUser.id,
      },
    }),
  ]);
  console.log("✓ 3 ritual events seeded");

  // ── Duties ────────────────────────────────────────────────
  await prisma.duty.upsert({
    where: { id: "c0000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "c0000000-0000-0000-0000-000000000001",
      clanId: clan.id,
      title: "Tu sửa mộ Cụ Tổ Nguyễn Văn Tổ",
      description: "Sửa lại phần mái và tường bao quanh mộ. Ước tính chi phí 5 triệu đồng.",
      category: DutyCategory.MAINTENANCE,
      priority: DutyPriority.HIGH,
      assignedTo: g5Members[0].id,
      status: DutyStatus.ACTIVE,
      progress: 30,
      dueDate: new Date(`${currentYear}-04-01`),
      createdBy: adminUser.id,
    },
  });
  await prisma.duty.upsert({
    where: { id: "c0000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "c0000000-0000-0000-0000-000000000002",
      clanId: clan.id,
      title: "Chuẩn bị mâm cỗ Giỗ Tổ",
      description: "Phụ trách chuẩn bị mâm cúng gồm 10 món truyền thống cho lễ giỗ ngày 15/3.",
      category: DutyCategory.RELIGIOUS,
      priority: DutyPriority.HIGH,
      ritualEventId: rituals[0].id,
      status: DutyStatus.QUEUE,
      progress: 0,
      dueDate: new Date(`${currentYear}-03-13`),
      createdBy: adminUser.id,
    },
  });
  await prisma.duty.upsert({
    where: { id: "c0000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "c0000000-0000-0000-0000-000000000003",
      clanId: clan.id,
      title: "Số hóa gia phả viết tay",
      description: "Chụp và số hóa cuốn gia phả viết tay từ năm 1900, hiện lưu ở nhà ông Nguyễn Văn An.",
      category: DutyCategory.ARCHIVAL,
      priority: DutyPriority.MEDIUM,
      assignedTo: g5Members[1].id,
      status: DutyStatus.QUEUE,
      progress: 0,
      createdBy: adminUser.id,
    },
  });
  await prisma.duty.upsert({
    where: { id: "c0000000-0000-0000-0000-000000000004" },
    update: {},
    create: {
      id: "c0000000-0000-0000-0000-000000000004",
      clanId: clan.id,
      title: "Chụp ảnh tất cả mộ phần",
      description: "Dùng drone chụp toàn cảnh khu mộ họ Nguyễn tại làng Bình An.",
      category: DutyCategory.MAINTENANCE,
      priority: DutyPriority.LOW,
      status: DutyStatus.COMPLETED,
      progress: 100,
      createdBy: adminUser.id,
    },
  });
  await prisma.duty.upsert({
    where: { id: "c0000000-0000-0000-0000-000000000005" },
    update: {},
    create: {
      id: "c0000000-0000-0000-0000-000000000005",
      clanId: clan.id,
      title: "Sửa mộ Nguyễn Văn Thành (bị nghiêng)",
      description: "Dựng thẳng và gia cố móng mộ về vị trí đúng.",
      category: DutyCategory.MAINTENANCE,
      priority: DutyPriority.URGENT,
      assignedTo: g5Members[3].id,
      status: DutyStatus.ACTIVE,
      progress: 10,
      dueDate: new Date(`${currentYear}-06-01`),
      createdBy: adminUser.id,
    },
  });
  console.log("✓ 5 duties seeded");

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────");
  console.log("Admin:  admin@heritage.local / heritage2025!");
  console.log("Editor: editor@heritage.local / editor2025!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
