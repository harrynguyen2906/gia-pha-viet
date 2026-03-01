import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId, getUserId, canEdit } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);

  const condition = req.nextUrl.searchParams.get("condition");
  const siteType = req.nextUrl.searchParams.get("siteType");

  const sites = await prisma.graveSite.findMany({
    where: {
      clanId,
      deletedAt: null,
      ...(condition ? { condition: condition as any } : {}),
      ...(siteType ? { siteType: siteType as any } : {}),
    },
    include: {
      member: {
        select: { id: true, fullName: true, isDeceased: true, avatarUrl: true },
      },
      media: { where: { mediaType: "PANORAMA" }, take: 1, select: { id: true, url: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    sites.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      memberName: s.member.fullName,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      condition: s.condition,
      siteType: s.siteType,
      sectionPlot: s.sectionPlot,
      epitaph: s.epitaph,
      lastVisited: s.lastVisited?.toISOString().split("T")[0] ?? null,
      hasPanorama: s.media.length > 0,
      panoramaUrl: s.media[0]?.url ?? null,
    }))
  );
}

const createSiteSchema = z.object({
  memberId: z.string().uuid(),
  sectionPlot: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  epitaph: z.string().nullable().optional(),
  condition: z.enum(["MAINTAINED", "NEEDS_VISIT", "WEATHERED", "RESTORATION"]).default("MAINTAINED"),
  siteType: z.enum(["TEMPLE", "CHURCH", "CEMETERY", "PRIVATE", "OTHER"]).default("CEMETERY"),
  lastVisited: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  const userId = getUserId(session);
  if (!clanId) return err("No clan", 403);
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const body = await req.json();
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const site = await prisma.graveSite.create({
    data: {
      memberId: data.memberId,
      clanId,
      sectionPlot: data.sectionPlot ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      epitaph: data.epitaph ?? null,
      condition: data.condition,
      siteType: data.siteType,
      lastVisited: data.lastVisited ? new Date(data.lastVisited) : null,
      registeredBy: userId ?? undefined,
    },
  });

  return ok(site, 201);
}
