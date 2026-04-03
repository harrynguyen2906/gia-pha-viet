import { Suspense } from "react";
import ClansDashboardClient from "./ClansDashboardClient";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

async function getClans() {
  const clans = await prisma.clan.findMany({
    include: {
      _count: {
        select: { users: true },
      },
      subscriptions: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          tier: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const enhancedClans = await Promise.all(
    clans.map(async (clan) => {
      const memberCount = await prisma.members.count({
        where: { clan_id: clan.id },
      });

      return {
        id: clan.id,
        name: clan.name,
        createdAt: clan.createdAt,
        updatedAt: clan.updatedAt,
        userCount: clan._count.users,
        memberCount,
        activeSubscription: clan.subscriptions[0] || null,
      };
    })
  );

  return JSON.parse(JSON.stringify(enhancedClans));
}

export default async function ClansPage() {
  const data = await getClans();
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Quản Lý Gia Tộc</h2>
      </div>
      <Suspense fallback={<div>Đang tải...</div>}>
        <ClansDashboardClient initialData={data} />
      </Suspense>
    </div>
  );
}
