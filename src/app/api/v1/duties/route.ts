import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, canEdit } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

  const url = req.nextUrl;
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const assigneeId = url.searchParams.get("assigneeId");
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  const duties = await prisma.duty.findMany({
    where: {
      clanId,
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
      ...(category ? { category: category as any } : {}),
      ...(assigneeId ? { assignedTo: assigneeId } : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    include: {
      assignee: {
        select: { id: true, fullName: true, generation: true, avatarUrl: true },
      },
      logs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const hasMore = duties.length > limit;
  const items = hasMore ? duties.slice(0, limit) : duties;

  return ok({
    data: items,
    pagination: { nextCursor: hasMore ? items[items.length - 1].id : null, hasMore },
  });
}

const dutySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().nullable().optional(),
  category: z.enum(["GRAVE_CARE", "RITUAL_PREP", "DOCUMENTATION", "MEDIA_UPLOAD", "ADMIN", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assignedGroup: z.enum(["ALL", "MALE_LINE", "FEMALE_LINE", "ELDERS", "YOUTH"]).default("ALL"),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  ritualEventId: z.string().uuid().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId, userId, role } = tc;
  if (!canEdit(role)) return err("Forbidden", 403);

  const body = await req.json();
  const parsed = dutySchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const duty = await prisma.duty.create({
    data: {
      clanId,
      title: data.title,
      description: data.description ?? null,
      category: data.category as any,
      priority: data.priority as any,
      assignedTo: data.assigneeId ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      ritualEventId: data.ritualEventId ?? null,
      status: "QUEUE",
      progress: 0,
      createdBy: userId ?? undefined,
    },
  });

  return ok(duty, 201);
}
