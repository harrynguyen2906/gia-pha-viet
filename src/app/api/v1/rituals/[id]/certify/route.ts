import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, canCertify } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId, userId, role } = tc;
  if (!canCertify(role)) return err("Forbidden — Elder or Admin required", 403);

  const { id } = await params;
  const existing = await prisma.ritualEvent.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);
  if (existing.isCertified) return err("Already certified", 409);

  const updated = await prisma.ritualEvent.update({
    where: { id },
    data: {
      isCertified: true,
      certifiedBy: userId ?? undefined,
      certifiedAt: new Date(),
    },
  });

  return ok({ certified: true, ritual: { id: updated.id, title: updated.title, isCertified: updated.isCertified } });
}
