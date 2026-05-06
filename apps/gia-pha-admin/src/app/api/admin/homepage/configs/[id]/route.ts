import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { findHomepageConfigOrNull } from "@/lib/homepage/configs";
import { getHomepageSession } from "@/lib/homepage/auth";
import { homepageDraftUpdateSchema } from "@/lib/homepage/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const config = await findHomepageConfigOrNull(id);

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/admin/homepage/configs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const current = await prisma.homepageConfig.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    if (current.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT configs can be edited" }, { status: 400 });
    }

    const payload = homepageDraftUpdateSchema.parse(await request.json());

    if (payload.backgroundAssetId) {
      const backgroundAsset = await prisma.homepageAsset.findUnique({
        where: { id: payload.backgroundAssetId },
      });
      if (!backgroundAsset) {
        return NextResponse.json({ error: "Background asset not found" }, { status: 400 });
      }
    }

    if (
      payload.backgroundAssetId &&
      (!payload.backgroundWidth || !payload.backgroundHeight) &&
      (payload.backgroundAssetId !== current.backgroundAssetId ||
        !current.backgroundWidth ||
        !current.backgroundHeight)
    ) {
      return NextResponse.json(
        {
          error:
            "When changing background asset, backgroundWidth and backgroundHeight are required.",
        },
        { status: 400 }
      );
    }

    await prisma.homepageConfig.update({
      where: { id },
      data: {
        name: payload.name ?? current.name,
        backgroundAssetId: payload.backgroundAssetId ?? current.backgroundAssetId,
        backgroundWidth: payload.backgroundWidth ?? current.backgroundWidth,
        backgroundHeight: payload.backgroundHeight ?? current.backgroundHeight,
        layers: (payload.layers ?? current.layers) as Prisma.InputJsonValue,
      },
    });

    const updated = await findHomepageConfigOrNull(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/homepage/configs/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
