import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

  const url = req.nextUrl;
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return err("?q= (min 2 chars) required", 422);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);

  const [members, rituals] = await Promise.all([
    prisma.member.findMany({
      where: {
        clanId,
        deletedAt: null,
        fullName: { contains: q, mode: "insensitive" },
      },
      take: limit,
      select: {
        id: true,
        fullName: true,
        generation: true,
        isDeceased: true,
        birthDateSolar: true,
        deathDateSolar: true,
        avatarUrl: true,
      },
    }),
    prisma.ritualEvent.findMany({
      where: {
        clanId,
        deletedAt: null,
        title: { contains: q, mode: "insensitive" },
      },
      take: limit,
      select: {
        id: true,
        title: true,
        dateSolar: true,
        dateLunar: true,
        isCertified: true,
      },
    }),
  ]);

  return ok({
    query: q,
    results: {
      members: members.map((m) => ({ ...m, type: "MEMBER" })),
      rituals: rituals.map((r) => ({
        ...r,
        dateSolar: r.dateSolar?.toISOString().split("T")[0] ?? null,
        type: "RITUAL",
      })),
    },
    totals: { members: members.length, rituals: rituals.length },
  });
}
