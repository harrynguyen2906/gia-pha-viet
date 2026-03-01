import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId, getUserId, canEdit, canDelete } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);

  const { id } = await params;
  const ritual = await prisma.ritualEvent.findFirst({
    where: { id, clanId, deletedAt: null },
    include: {
      ancestor: { select: { id: true, fullName: true, avatarUrl: true } },
      instructions: { orderBy: { sortOrder: "asc" } },
      ritualDuties: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!ritual) return err("Not found", 404);

  return ok({
    ...ritual,
    dateSolar: ritual.dateSolar?.toISOString().split("T")[0] ?? null,
  });
}

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  dateSolar: z.string().optional(),
  dateLunar: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  lunarRecurrence: z.string().nullable().optional(),
  ancestorId: z.string().uuid().nullable().optional(),
  isCertified: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  const userId = getUserId(session);
  if (!clanId) return err("No clan", 403);
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.ritualEvent.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const updated = await prisma.ritualEvent.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.dateSolar !== undefined && { dateSolar: new Date(data.dateSolar) }),
      ...(data.dateLunar !== undefined && { dateLunar: data.dateLunar }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
      ...(data.lunarRecurrence !== undefined && { lunarRecurrence: data.lunarRecurrence }),
      ...(data.ancestorId !== undefined && { ancestorId: data.ancestorId }),
      ...(data.isCertified !== undefined && { isCertified: data.isCertified }),
    },
  });

  return ok({
    ...updated,
    dateSolar: updated.dateSolar?.toISOString().split("T")[0] ?? null,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);
  if (!canDelete((session?.user as any)?.role)) return err("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.ritualEvent.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);

  await prisma.ritualEvent.update({ where: { id }, data: { deletedAt: new Date() } });
  return ok({ deleted: true });
}
