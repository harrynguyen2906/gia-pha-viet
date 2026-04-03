import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@/generated/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    
    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        clan: { select: { id: true, name: true } },
        tier: { select: { id: true, nameVi: true } },
        billingInfo: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { status, notes, refundAmount } = await request.json();

    const currentOrder = await prisma.order.findUnique({ where: { id: resolvedParams.id } });
    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (status && Object.values(OrderStatus).includes(status)) {
      dataToUpdate.status = status as OrderStatus;
      if (status === "REFUNDED" && refundAmount) {
        dataToUpdate.refundAmount = refundAmount;
        dataToUpdate.refundedAt = new Date();
      }
      if (status === "COMPLETED" && currentOrder.status !== "COMPLETED") {
        dataToUpdate.paidAt = new Date();
      }
    }
    if (notes !== undefined) {
      dataToUpdate.notes = notes;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
      include: {
        user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
        clan: { select: { id: true, name: true } },
        tier: { select: { id: true, nameVi: true } },
        billingInfo: true
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        action: "UPDATE_ORDER",
        entityId: resolvedParams.id,
        entityType: "ORDER",
        newValue: JSON.stringify(dataToUpdate),
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
