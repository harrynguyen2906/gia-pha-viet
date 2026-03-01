import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);

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
