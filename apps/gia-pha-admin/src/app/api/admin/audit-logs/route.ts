import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.adminUser.findUnique({ where: { id: session.user.id } });
    if (currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const action = searchParams.get("action") || "";
    const adminUserId = searchParams.get("adminUserId") || "";
    const entityType = searchParams.get("entityType") || "";

    const skip = (page - 1) * pageSize;
    let where: any = {};

    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entityType) where.entityType = { contains: entityType, mode: "insensitive" };
    if (adminUserId) where.adminUserId = adminUserId;

    const [logs, totalCount] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          adminUser: {
            select: { id: true, email: true, displayName: true }
          }
        }
      }),
      prisma.adminAuditLog.count({ where })
    ]);

    return NextResponse.json({
      items: logs,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
