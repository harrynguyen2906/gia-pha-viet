import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);

  const sites = await prisma.graveSite.findMany({
    where: { clanId, deletedAt: null },
    select: { condition: true },
  });

  const stats: Record<string, number> = {
    MAINTAINED: 0,
    NEEDS_VISIT: 0,
    WEATHERED: 0,
    RESTORATION: 0,
  };
  for (const s of sites) {
    const key = s.condition;
    stats[key] = (stats[key] ?? 0) + 1;
  }

  return ok({ total: sites.length, byCondition: stats });
}
