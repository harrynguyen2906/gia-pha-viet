import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const clans = await prisma.clan.findMany({
      include: {
        _count: {
          select: { users: true },
        },
        subscriptions: {
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            tier: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // For each clan, fetch the actual members count from the public.members table
    const enhancedClans = await Promise.all(
      clans.map(async (clan) => {
        const memberCount = await prisma.members.count({
          where: { clan_id: clan.id },
        });

        return {
          id: clan.id,
          name: clan.name,
          createdAt: clan.createdAt,
          updatedAt: clan.updatedAt,
          userCount: clan._count.users,
          memberCount,
          activeSubscription: clan.subscriptions[0] || null,
        };
      })
    );

    return NextResponse.json({ clans: enhancedClans }, { status: 200 });
  } catch (error) {
    console.error("[CLANS_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
