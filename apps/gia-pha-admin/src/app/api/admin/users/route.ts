import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "ALL"; // ACTIVE, INACTIVE, ALL
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    
    // Calculate skip
    const skip = (page - 1) * limit;

    // Build the query where clause
    const where: Prisma.UserWhereInput = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { profile: { displayName: { contains: search, mode: "insensitive" } } },
        { clan: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          profile: true,
          clan: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            include: { tier: true },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Format response
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      isActive: u.isActive,
      role: u.role,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      profile: u.profile,
      clan: u.clan,
      currentSubscription: u.subscriptions[0] || null,
    }));

    return NextResponse.json({
      data: formattedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
