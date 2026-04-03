import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    // Log the action finding out the admin who did it from session
    if (session.user && session.user.id) {
       await prisma.adminAuditLog.create({
         data: {
           adminUserId: session.user.id as string,
           action: body.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
           entityType: "USER",
           entityId: id,
           newValue: { reason: body.reason || "Status toggle from admin dashboard" }
         }
       });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("PUT /api/admin/users/[id]/status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
