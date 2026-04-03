import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { action, feedback } = await request.json(); // "APPROVE_END", "APPROVE_IMMEDIATE", "OFFER_RETENTION"

    const requestData = await prisma.cancellationRequest.findUnique({
      where: { id: resolvedParams.id },
      include: { subscription: true }
    });

    if (!requestData) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    
    let subUpdate: any = {};
    let reqUpdate: any = {
      processedBy: session.user.id,
      processedAt: now,
    };

    if (action === "APPROVE_END") {
      subUpdate.autoRenew = false;
      subUpdate.cancellationReason = requestData.cancellationReason;
    } else if (action === "APPROVE_IMMEDIATE") {
      subUpdate.status = "CANCELLED";
      subUpdate.cancelledAt = now;
      subUpdate.autoRenew = false;
      subUpdate.cancellationReason = requestData.cancellationReason;
    } else if (action === "OFFER_RETENTION") {
      reqUpdate.retentionOffered = true;
      reqUpdate.processedAt = null; // Stays active/in queue but marked offered
      // Feedback can contain what was offered
      if (feedback) {
        reqUpdate.cancellationFeedback = (requestData.cancellationFeedback ? requestData.cancellationFeedback + "\n\n" : "") + "Admin Offered: " + feedback;
      }
    }

    const [updatedReq, updatedSub] = await prisma.$transaction([
      prisma.cancellationRequest.update({
        where: { id: resolvedParams.id },
        data: reqUpdate,
      }),
      ...(Object.keys(subUpdate).length > 0 ? [
        prisma.userSubscription.update({
          where: { id: requestData.subscriptionId },
          data: subUpdate
        })
      ] : [])
    ]);

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: session.user.id,
        action: "PROCESS_CANCELLATION",
        entityId: resolvedParams.id,
        entityType: "CANCELLATION_REQUEST",
        newValue: JSON.stringify({ action, subUpdate, reqUpdate }),
      }
    });

    return NextResponse.json({ request: updatedReq, subscription: updatedSub || requestData.subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
