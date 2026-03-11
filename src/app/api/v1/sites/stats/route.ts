import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

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
