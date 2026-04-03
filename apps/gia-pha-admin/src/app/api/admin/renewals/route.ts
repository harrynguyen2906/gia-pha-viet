import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "upcoming_30d"; // upcoming_7d, upcoming_30d, past_due, at_risk, recently_renewed
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const now = new Date();
    const plus7d = new Date(now);
    plus7d.setDate(now.getDate() + 7);
    
    const plus30d = new Date(now);
    plus30d.setDate(now.getDate() + 30);
    
    const minus30d = new Date(now);
    minus30d.setDate(now.getDate() - 30);

    let where: any = {};
    let orderBy: any = { expiresAt: "asc" };

    if (view === "upcoming_7d") {
      where = {
        expiresAt: { gte: now, lte: plus7d },
        status: { in: ["ACTIVE", "TRIAL"] }
      };
    } else if (view === "upcoming_30d") {
      where = {
        expiresAt: { gte: now, lte: plus30d },
        status: { in: ["ACTIVE", "TRIAL"] }
      };
    } else if (view === "past_due") {
      where = { status: "PAST_DUE" };
    } else if (view === "at_risk") {
      where = {
        autoRenew: false,
        status: { in: ["ACTIVE", "TRIAL"] },
        expiresAt: { gte: now }
      };
    } else if (view === "recently_renewed") {
      where = {
        startedAt: { gte: minus30d },
        status: { in: ["ACTIVE", "TRIAL"] }
      };
      orderBy = { startedAt: "desc" };
    }

    const skip = (page - 1) * pageSize;

    const [subscriptions, totalCount] = await Promise.all([
      prisma.userSubscription.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: { select: { email: true, profile: { select: { displayName: true } } } },
          clan: { select: { name: true } },
          tier: { select: { nameVi: true, priceMonthly: true, priceYearly: true } },
        }
      }),
      prisma.userSubscription.count({ where })
    ]);

    return NextResponse.json({
      items: subscriptions,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
