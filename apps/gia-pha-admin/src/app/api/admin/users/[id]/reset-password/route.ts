import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.password_reset_tokens.create({
      data: {
        user_id: user.id,
        token,
        expires_at,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;

    if (session.user && session.user.id) {
       await prisma.adminAuditLog.create({
         data: {
           adminUserId: session.user.id as string,
           action: "INITIATE_PASSWORD_RESET",
           entityType: "USER",
           entityId: id,
         }
       });
    }

    return NextResponse.json({ resetLink });
  } catch (error) {
    console.error("POST /api/admin/users/[id]/reset-password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
