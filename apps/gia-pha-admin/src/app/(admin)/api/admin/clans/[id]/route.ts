import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const clanId = params.id;

    if (!clanId) {
      return new NextResponse("Clan ID missing", { status: 400 });
    }

    const clan = await prisma.clan.findUnique({
      where: { id: clanId },
      include: {
        users: {
          include: {
            profile: true,
          },
        },
        subscriptions: {
          where: {
            status: {
              in: ["ACTIVE", "PAST_DUE", "TRIAL"],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            tier: true,
          },
        },
      },
    });

    if (!clan) {
      return new NextResponse("Clan not found", { status: 404 });
    }

    const memberCount = await prisma.members.count({
      where: { clan_id: clan.id },
    });

    return NextResponse.json(
      { clan, memberCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CLAN_ID_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
