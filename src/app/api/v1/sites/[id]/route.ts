import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId, canEdit, canDelete } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);

  const { id } = await params;
  const site = await prisma.graveSite.findFirst({
    where: { id, clanId, deletedAt: null },
    include: {
      member: { select: { id: true, fullName: true, birthDateSolar: true, deathDateSolar: true, avatarUrl: true } },
      media: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!site) return err("Not found", 404);

  return ok(site);
}

const patchSchema = z.object({
  sectionPlot: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  epitaph: z.string().nullable().optional(),
  condition: z.enum(["MAINTAINED", "NEEDS_VISIT", "WEATHERED", "RESTORATION"]).optional(),
  siteType: z.enum(["TEMPLE", "CHURCH", "CEMETERY", "PRIVATE", "OTHER"]).optional(),
  lastVisited: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.graveSite.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const updated = await prisma.graveSite.update({
    where: { id },
    data: {
      ...(data.sectionPlot !== undefined && { sectionPlot: data.sectionPlot }),
      ...(data.latitude !== undefined && { latitude: data.latitude ?? undefined }),
      ...(data.longitude !== undefined && { longitude: data.longitude ?? undefined }),
      ...(data.epitaph !== undefined && { epitaph: data.epitaph }),
      ...(data.condition !== undefined && { condition: data.condition as any }),
      ...(data.siteType !== undefined && { siteType: data.siteType as any }),
      ...(data.lastVisited !== undefined && {
        lastVisited: data.lastVisited ? new Date(data.lastVisited) : null,
      }),
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);
  if (!canDelete((session?.user as any)?.role)) return err("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.graveSite.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);

  await prisma.graveSite.update({ where: { id }, data: { deletedAt: new Date() } });
  return ok({ deleted: true });
}
