import { prisma } from "@/lib/prisma";

export async function checkSubscriptionLimit(
  clanId: string,
  limitKey: 'max_members' | 'max_media_mb' | 'max_grave_sites' | 'max_rituals'
) {
  const activeSub = await prisma.userSubscription.findFirst({
    where: { clanId, status: 'ACTIVE' },
    include: { tier: true },
    orderBy: { createdAt: 'desc' }
  });

  if (!activeSub || !activeSub.tier) {
    return { allowed: false, current: 0, limit: 0, tierName: 'None' };
  }

  const limits = activeSub.tier.limits as Record<string, any> || {};
  let limit = limits[limitKey];

  if (limit === undefined || limit === null) {
    limit = -1; // Default to unlimited if not specified
  }

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, tierName: activeSub.tier.nameVi };
  }

  let current = 0;

  switch (limitKey) {
    case 'max_members':
      current = await prisma.member.count({ where: { clanId } });
      break;
    case 'max_grave_sites':
      current = await prisma.graveSite.count({ where: { clanId } });
      break;
    case 'max_rituals':
      current = await prisma.ritualEvent.count({ where: { clanId } });
      break;
    case 'max_media_mb':
      // Simplified mock: in real scenario, sum media sizes
      // current = await prisma.media.aggregate({ _sum: { size: true } });
      current = 0;
      break;
  }

  return {
    allowed: current < limit,
    current,
    limit,
    tierName: activeSub.tier.nameVi
  };
}
