import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, canEdit } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";
import { checkSubscriptionLimit } from "@/lib/subscription-limits";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

  const url = req.nextUrl;
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  const dateFilter: Record<string, unknown> = {};
  if (year && month) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0);
    dateFilter.dateSolar = { gte: start, lte: end };
  } else if (year) {
    const start = new Date(Number(year), 0, 1);
    const end = new Date(Number(year), 11, 31);
    dateFilter.dateSolar = { gte: start, lte: end };
  }

  const rituals = await prisma.ritualEvent.findMany({
    where: { clanId, deletedAt: null, ...dateFilter },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { dateSolar: "asc" },
    include: {
      ancestor: { select: { id: true, fullName: true, avatarUrl: true } },
      instructions: { orderBy: { sortOrder: "asc" } },
      ritualDuties: { orderBy: { sortOrder: "asc" } },
    },
  });

  const hasMore = rituals.length > limit;
  const items = hasMore ? rituals.slice(0, limit) : rituals;

  return ok({
    data: items.map((r) => ({
      ...r,
      dateSolar: r.dateSolar?.toISOString().split("T")[0] ?? null,
    })),
    pagination: { nextCursor: hasMore ? items[items.length - 1].id : null, hasMore },
  });
}

const ritualSchema = z.object({
  ancestorId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(300),
  description: z.string().nullable().optional(),
  dateSolar: z.string(),
  dateLunar: z.string().nullable().optional(),
  isRecurring: z.boolean().default(true),
  lunarRecurrence: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId, userId, role } = tc;
  if (!canEdit(role)) return err("Forbidden", 403);

  // Check subscription limit before allowing creation
  const limitCheck = await checkSubscriptionLimit(clanId, 'max_rituals');
  if (!limitCheck.allowed) {
    return err(`Gói ${limitCheck.tierName} chỉ cho phép tối đa ${limitCheck.limit} ngày giỗ. Vui lòng nâng cấp.`, 402);
  }

  const body = await req.json();
  const parsed = ritualSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  const ritual = await prisma.ritualEvent.create({
    data: {
      clanId,
      ancestorId: data.ancestorId ?? null,
      title: data.title,
      description: data.description ?? null,
      dateSolar: new Date(data.dateSolar),
      dateLunar: data.dateLunar ?? null,
      isRecurring: data.isRecurring,
      lunarRecurrence: data.lunarRecurrence ?? null,
      createdBy: userId ?? undefined,
    },
  });

  return ok(ritual, 201);
}
