import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const tiers = await prisma.subscriptionTier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
    
    return NextResponse.json(tiers);
  } catch (error) {
    console.error("[PRICING_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
