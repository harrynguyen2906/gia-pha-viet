import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const history = await prisma.adminAuditLog.findMany({
      where: {
        entityType: "USER",
        entityId: id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        adminUser: {
          select: { email: true, displayName: true }
        }
      }
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET /api/admin/users/[id]/history error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
