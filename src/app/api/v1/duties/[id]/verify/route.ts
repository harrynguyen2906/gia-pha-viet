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
  const existing = await prisma.duty.findFirst({ where: { id, clanId, deletedAt: null } });
  if (!existing) return err("Not found", 404);
  if (existing.verifiedAt) return err("Already verified", 409);
  if (existing.status !== "COMPLETED") return err("Duty must be COMPLETED before verification", 422);

  const updated = await prisma.duty.update({
    where: { id },
    data: {
      verifiedBy: userId ?? undefined,
      verifiedAt: new Date(),
    },
  });

  await prisma.dutyLog.create({
    data: {
      dutyId: id,
      performedBy: userId ?? undefined,
      action: "verified",
      oldValue: "COMPLETED",
      newValue: "COMPLETED",
    },
  });

  return ok({ verified: true, duty: { id: updated.id, title: updated.title, status: updated.status } });
}
