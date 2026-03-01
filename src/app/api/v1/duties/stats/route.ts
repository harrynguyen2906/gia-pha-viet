import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err, requireAuth, getClanId } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const clanId = getClanId(session);
  if (!clanId) return err("No clan", 403);

  const [total, queue, active, completed, overdue] = await Promise.all([
    prisma.duty.count({ where: { clanId, deletedAt: null } }),
    prisma.duty.count({ where: { clanId, deletedAt: null, status: "QUEUE" } }),
    prisma.duty.count({ where: { clanId, deletedAt: null, status: "ACTIVE" } }),
    prisma.duty.count({ where: { clanId, deletedAt: null, status: "COMPLETED" } }),
    prisma.duty.count({
      where: {
        clanId,
        deletedAt: null,
        status: { notIn: ["COMPLETED"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  const efficiencyRating = total > 0 ? Math.round((completed / total) * 100) : 0;

  return ok({
    total,
    byStatus: { queue, active, completed, verified: 0, cancelled: 0 },
    overdue,
    efficiencyRating,
    pendingReview: 0,
  });
}
