import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const params = await props.params;
    const { id: clanId, userId } = params;

    if (!clanId || !userId) {
      return new NextResponse("Missing IDs", { status: 400 });
    }

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive === "undefined") {
      return new NextResponse("Missing isActive in body", { status: 400 });
    }

    // Verify the user belongs to the clan
    const userToUpdate = await prisma.user.findFirst({
      where: {
        id: userId,
        clanId: clanId,
      },
    });

    if (!userToUpdate) {
      return new NextResponse("User not found or not in clan", { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("[CLAN_USER_PUT]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
