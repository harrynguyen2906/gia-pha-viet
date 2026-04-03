import { Suspense } from "react";
import ClanDetailClient from "./ClanDetailClient";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

async function getClanDetail(id: string) {
  const clan = await prisma.clan.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          profile: true,
        },
      },
      subscriptions: {
        where: {
          status: {
            in: ["ACTIVE", "PAST_DUE", "TRIAL"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          tier: true,
        },
      },
    },
  });

  if (!clan) {
    return null;
  }

  const memberCount = await prisma.members.count({
    where: { clan_id: clan.id },
  });

  return JSON.parse(JSON.stringify({ clan, memberCount }));
}

export default async function ClanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const data = await getClanDetail(resolvedParams.id);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Suspense fallback={<div>Đang tải thông tin gia tộc...</div>}>
        <ClanDetailClient initialData={data} clanId={resolvedParams.id} />
      </Suspense>
    </div>
  );
}
