import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tiers = await prisma.subscriptionTier.findMany({
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(tiers);
  } catch (error) {
    console.error("GET /api/admin/tiers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const newTier = await prisma.subscriptionTier.create({
      data: {
        slug: data.slug,
        nameVi: data.nameVi,
        nameEn: data.nameEn,
        descriptionVi: data.descriptionVi || null,
        descriptionEn: data.descriptionEn || null,
        priceMonthly: data.priceMonthly || 0,
        priceYearly: data.priceYearly || 0,
        currency: data.currency || "VND",
        features: data.features || [],
        limits: data.limits || {},
        badgeColor: data.badgeColor || null,
        badgeIcon: data.badgeIcon || null,
        isPopular: data.isPopular || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
        displayOrder: data.displayOrder || 0,
      },
    });

    return NextResponse.json(newTier, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/tiers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
