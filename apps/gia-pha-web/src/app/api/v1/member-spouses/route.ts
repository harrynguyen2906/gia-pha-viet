import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, err, canEdit } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

const schema = z.object({
  memberAId: z.string().uuid(),
  memberBId: z.string().uuid(),
  marriageDate: z.string().nullable().optional(),
  divorceDate: z.string().nullable().optional(),
  isCurrent: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId, role } = tc;
  if (!canEdit(role)) return err("Forbidden", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 422);

  const data = parsed.data;
  if (data.memberAId === data.memberBId) return err("Cannot link member to itself", 422);

  // MT-006: Verify both members belong to the session clan
  const [memberA, memberB] = await Promise.all([
    prisma.member.findFirst({ where: { id: data.memberAId, clanId, deletedAt: null } }),
    prisma.member.findFirst({ where: { id: data.memberBId, clanId, deletedAt: null } }),
  ]);
  if (!memberA || !memberB) return err("Members not found in your clan", 404);

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
