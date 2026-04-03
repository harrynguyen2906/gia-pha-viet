import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const currentUser = await prisma.adminUser.findUnique({ where: { id: session.user.id } });
    if (currentUser?.role !== "SUPER_ADMIN" && session.user.id !== resolvedParams.id) {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const { displayName, role, isActive } = await request.json();
    const dataToUpdate: any = {};
    if (displayName) dataToUpdate.displayName = displayName;
    if (role && currentUser?.role === "SUPER_ADMIN") dataToUpdate.role = role;
    if (isActive !== undefined && currentUser?.role === "SUPER_ADMIN") dataToUpdate.isActive = isActive;

    const oldUser = await prisma.adminUser.findUnique({ where: { id: resolvedParams.id }});

    const updatedUser = await prisma.adminUser.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        action: "UPDATE_ADMIN",
        entityId: resolvedParams.id,
        entityType: "ADMIN_USER",
        oldValue: JSON.stringify({ displayName: oldUser?.displayName, role: oldUser?.role, isActive: oldUser?.isActive }),
        newValue: JSON.stringify(dataToUpdate),
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.adminUser.findUnique({ where: { id: session.user.id } });
    if (currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const resolvedParams = await params;

    // Don't let users delete themselves
    if (session.user.id === resolvedParams.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const deletedUser = await prisma.adminUser.delete({
      where: { id: resolvedParams.id },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        action: "DELETE_ADMIN",
        entityId: resolvedParams.id,
        entityType: "ADMIN_USER",
        oldValue: JSON.stringify({ id: deletedUser.id, email: deletedUser.email }),
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
