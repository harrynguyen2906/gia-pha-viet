import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

  const [clan, memberCount, deceasedCount, siteCount, ritualCount, certifiedCount] = await Promise.all([
    prisma.clan.findUnique({ where: { id: clanId } }),
    prisma.member.count({ where: { clanId, deletedAt: null } }),
    prisma.member.count({ where: { clanId, deletedAt: null, isDeceased: true } }),
    prisma.graveSite.count({ where: { clanId, deletedAt: null } }),
    prisma.ritualEvent.count({ where: { clanId, deletedAt: null } }),
    prisma.ritualEvent.count({ where: { clanId, deletedAt: null, isCertified: true } }),
  ]);

  if (!clan) return err("Clan not found", 404);

  const generations = await prisma.member.groupBy({
    by: ["generation"],
    where: { clanId, deletedAt: null },
    _count: { _all: true },
    orderBy: { generation: "asc" },
  });

  return ok({
    clan,
    stats: {
      totalMembers: memberCount,
      deceasedMembers: deceasedCount,
      livingMembers: memberCount - deceasedCount,
      graveSites: siteCount,
      rituals: ritualCount,
      certifiedRituals: certifiedCount,
      generationBreakdown: generations.map((g) => ({
        generation: g.generation,
        count: g._count._all,
      })),
    },
  });
}
