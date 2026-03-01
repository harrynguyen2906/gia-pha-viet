import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId, canEdit } from "@/lib/api";

const schema = z.object({
  memberAId: z.string().uuid(),
  memberBId: z.string().uuid(),
  marriageDate: z.string().nullable().optional(),
  divorceDate: z.string().nullable().optional(),
  isCurrent: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!canEdit((session?.user as any)?.role)) return err("Forbidden", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  if (data.memberAId === data.memberBId) return err("Cannot link member to itself", 422);

  // Ensure ordered pair (a < b) for deduplication
  const [memberAId, memberBId] =
    data.memberAId < data.memberBId
      ? [data.memberAId, data.memberBId]
      : [data.memberBId, data.memberAId];

  const spouse = await prisma.memberSpouse.upsert({
    where: { memberAId_memberBId: { memberAId, memberBId } },
    update: {
      marriageDate: data.marriageDate ? new Date(data.marriageDate) : null,
      divorceDate: data.divorceDate ? new Date(data.divorceDate) : null,
      isCurrent: data.isCurrent,
    },
    create: {
      memberAId,
      memberBId,
      marriageDate: data.marriageDate ? new Date(data.marriageDate) : null,
      divorceDate: data.divorceDate ? new Date(data.divorceDate) : null,
      isCurrent: data.isCurrent,
    },
  });

  return ok(spouse, 201);
}
