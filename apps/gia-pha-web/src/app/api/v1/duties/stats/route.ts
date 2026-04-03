import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

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
