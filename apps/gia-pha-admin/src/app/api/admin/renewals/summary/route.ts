import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const plus7d = new Date(now);
    plus7d.setDate(now.getDate() + 7);
    
    const plus30d = new Date(now);
    plus30d.setDate(now.getDate() + 30);

    const upcoming7dCount = await prisma.userSubscription.count({
      where: {
        expiresAt: { gte: now, lte: plus7d },
        status: { in: ["ACTIVE", "TRIAL"] }
      }
    });

    const upcoming30dCount = await prisma.userSubscription.count({
      where: {
        expiresAt: { gte: now, lte: plus30d },
        status: { in: ["ACTIVE", "TRIAL"] }
      }
    });

    const pastDueCount = await prisma.userSubscription.count({
      where: {
        status: "PAST_DUE"
      }
    });

    const atRiskCount = await prisma.userSubscription.count({
      where: {
        autoRenew: false,
        status: { in: ["ACTIVE", "TRIAL"] },
        expiresAt: { gte: now }
      }
    });

    return NextResponse.json({
      upcoming7d: upcoming7dCount,
      upcoming30d: upcoming30dCount,
      pastDue: pastDueCount,
      atRisk: atRiskCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
