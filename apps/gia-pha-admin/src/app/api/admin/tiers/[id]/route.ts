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

    const tier = await prisma.subscriptionTier.findUnique({
      where: { id },
    });

    if (!tier) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(tier);
  } catch (error) {
    console.error("GET /api/admin/tiers/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const updatedTier = await prisma.subscriptionTier.update({
      where: { id },
      data: {
        slug: data.slug,
        nameVi: data.nameVi,
        nameEn: data.nameEn,
        descriptionVi: data.descriptionVi,
        descriptionEn: data.descriptionEn,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        currency: data.currency,
        features: data.features,
        limits: data.limits,
        badgeColor: data.badgeColor,
        badgeIcon: data.badgeIcon,
        isPopular: data.isPopular,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
      },
    });

    return NextResponse.json(updatedTier);
  } catch (error) {
    console.error("PUT /api/admin/tiers/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Soft delete
    const deletedTier = await prisma.subscriptionTier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(deletedTier);
  } catch (error) {
    console.error("DELETE /api/admin/tiers/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
