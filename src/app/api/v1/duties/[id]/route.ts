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
  const duty = await prisma.duty.findFirst({
    where: { id, clanId, deletedAt: null },
    include: {
      assignee: { select: { id: true, fullName: true, generation: true, avatarUrl: true } },
      ritualEvent: { select: { id: true, title: true, dateSolar: true } },
      logs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!duty) return err("Not found", 404);

  return ok(duty);
}

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["QUEUE", "ACTIVE", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  assignedGroup: z.enum(["ALL", "MALE_LINE", "FEMALE_LINE", "ELDERS", "YOUTH"]).optional(),
  dueDate: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  const userId = getUserId(session);
  if (!clanId) return err("No clan", 403);
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.duty.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const updated = await prisma.duty.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status as any }),
      ...(data.priority !== undefined && { priority: data.priority as any }),
      ...(data.progress !== undefined && { progress: data.progress }),
      ...(data.assigneeId !== undefined && { assignedTo: data.assigneeId }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
    },
  });

  // Log status changes
  if (data.status && data.status !== existing.status) {
    await prisma.dutyLog.create({
      data: {
        dutyId: id,
        performedBy: userId ?? undefined,
        action: "status_change",
        oldValue: existing.status,
        newValue: data.status,
      },
    });
  }

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);
  if (!canDelete((session?.user as any)?.role)) return err("Forbidden", 403);

  const { id } = await params;
  const existing = await prisma.duty.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);

  await prisma.duty.update({ where: { id }, data: { deletedAt: new Date() } });
  return ok({ deleted: true });
}
