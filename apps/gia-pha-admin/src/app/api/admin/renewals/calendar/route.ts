import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Month is 0-indexed in JS dates
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        expiresAt: { gte: startOfMonth, lte: endOfMonth }
      },
      select: {
        id: true,
        expiresAt: true,
        status: true,
        autoRenew: true
      }
    });

    const grouped: Record<string, { count: number, atRisk: number, totalRevenue: number }> = {};
    
    subscriptions.forEach(sub => {
      const dateStr = sub.expiresAt.toISOString().split('T')[0];
      if (!grouped[dateStr]) grouped[dateStr] = { count: 0, atRisk: 0, totalRevenue: 0 };
      grouped[dateStr].count += 1;
      if (!sub.autoRenew) grouped[dateStr].atRisk += 1;
    });

    return NextResponse.json(grouped);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
