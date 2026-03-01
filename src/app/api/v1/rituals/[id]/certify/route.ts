import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId, getUserId, canCertify } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  const userId = getUserId(session);
  if (!clanId) return err("No clan", 403);
  if (!canCertify((session?.user as any)?.role)) return err("Forbidden — Elder or Admin required", 403);

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
