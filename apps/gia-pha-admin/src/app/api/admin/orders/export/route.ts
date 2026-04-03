import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { email: true } },
        clan: { select: { name: true } },
        tier: { select: { nameVi: true } },
        billingInfo: true
      }
    });

    const csvRows = ["Order ID,Date,User,Clan,Tier,Amount,Status,Payment Method"];
    
    for (const order of orders) {
      csvRows.push([
        order.id, 
        order.createdAt.toISOString(), 
        order.user.email,
        order.clan.name,
        order.tier.nameVi,
        order.amount.toString(),
        order.status,
        order.paymentMethod || "N/A"
      ].join(","));
    }

    const csvContent = csvRows.join("\n");
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders_export_${Date.now()}.csv"`,
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
