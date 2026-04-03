import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { userId } = tc;

  const url = req.nextUrl;
  const unreadOnly = url.searchParams.get("unread") === "true";
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;

  const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });

  return ok({
    data: items,
    pagination: { nextCursor: hasMore ? items[items.length - 1].id : null, hasMore },
    unreadCount,
  });
}

const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().default(false),
});

export async function PATCH(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { userId } = tc;

  const body = await req.json();
  const parsed = markReadSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const now = new Date();

  if (data.markAll) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });
    return ok({ markedAll: true });
  }

  if (data.ids && data.ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: data.ids } },
      data: { readAt: now },
    });
    return ok({ markedCount: data.ids.length });
  }

  return err("Provide ids or markAll: true", 422);
}
