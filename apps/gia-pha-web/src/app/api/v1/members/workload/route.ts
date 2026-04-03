import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTenantContext } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const tc = await getTenantContext().catch((e) => handleApiError(e));
  if (tc instanceof Response) return tc;
  const { clanId } = tc;

  // Count active and completed duties per member
  const [active, completed, total] = await Promise.all([
    prisma.duty.groupBy({
      by: ["assignedTo"],
      where: { clanId, deletedAt: null, status: "ACTIVE", assignedTo: { not: null } },
      _count: { id: true },
    }),
    prisma.duty.groupBy({
      by: ["assignedTo"],
      where: { clanId, deletedAt: null, status: "COMPLETED", assignedTo: { not: null } },
      _count: { id: true },
    }),
    prisma.duty.groupBy({
      by: ["assignedTo"],
      where: { clanId, deletedAt: null, assignedTo: { not: null } },
      _count: { id: true },
    }),
  ]);

  const allMemberIds = [...new Set([
    ...active.map((r) => r.assignedTo!),
    ...completed.map((r) => r.assignedTo!),
    ...total.map((r) => r.assignedTo!),
  ])];

  if (allMemberIds.length === 0) return ok([]);

  const members = await prisma.member.findMany({
    where: { id: { in: allMemberIds }, clanId, deletedAt: null },
    select: { id: true, fullName: true, generation: true, avatarUrl: true },
  });

  const activeMap = Object.fromEntries(active.map((r) => [r.assignedTo!, r._count.id]));
  const completedMap = Object.fromEntries(completed.map((r) => [r.assignedTo!, r._count.id]));
  const totalMap = Object.fromEntries(total.map((r) => [r.assignedTo!, r._count.id]));

  const workload = members.map((m) => {
    const activeDuties = activeMap[m.id] ?? 0;
    const completedDuties = completedMap[m.id] ?? 0;
    const totalDuties = totalMap[m.id] ?? 0;
    const completion = totalDuties > 0 ? Math.round((completedDuties / totalDuties) * 100) : 0;
    return {
      member: m,
      activeDuties,
      completedDuties,
      totalDuties,
      completionRate: completion,
      level: activeDuties >= 5 ? "HIGH" : activeDuties >= 2 ? "MEDIUM" : "LOW",
    };
  });

  workload.sort((a, b) => b.activeDuties - a.activeDuties);
  return ok(workload);
}
