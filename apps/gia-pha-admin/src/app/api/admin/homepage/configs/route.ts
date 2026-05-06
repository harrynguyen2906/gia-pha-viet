import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHomepageSession } from "@/lib/homepage/auth";
import { listHomepageConfigs } from "@/lib/homepage/configs";
import { homepageDraftCreateSchema } from "@/lib/homepage/schemas";

export async function GET() {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await listHomepageConfigs();
    return NextResponse.json(configs);
  } catch (error) {
    console.error("GET /api/admin/homepage/configs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = homepageDraftCreateSchema.parse(await request.json().catch(() => ({})));
    let sourceConfig = payload.sourceConfigId
      ? await prisma.homepageConfig.findUnique({ where: { id: payload.sourceConfigId } })
      : null;

    if (!sourceConfig) {
      sourceConfig = await prisma.homepageConfig.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
      });
    }

    const nextBackgroundAssetId = sourceConfig?.backgroundAssetId ?? payload.backgroundAssetId;
    const nextBackgroundWidth = sourceConfig?.backgroundWidth ?? payload.backgroundWidth;
    const nextBackgroundHeight = sourceConfig?.backgroundHeight ?? payload.backgroundHeight;
    const nextLayers = sourceConfig?.layers ?? payload.layers ?? [];

    if (!nextBackgroundAssetId || !nextBackgroundWidth || !nextBackgroundHeight) {
      return NextResponse.json(
        {
          error:
            "Unable to create draft. Provide a background asset + dimensions or publish at least one config first.",
        },
        { status: 400 }
      );
    }

    const backgroundAsset = await prisma.homepageAsset.findUnique({
      where: { id: nextBackgroundAssetId },
    });

    if (!backgroundAsset) {
      return NextResponse.json({ error: "Background asset not found" }, { status: 400 });
    }

    const createdConfig = await prisma.homepageConfig.create({
      data: {
        status: "DRAFT",
        version: null,
        name:
          payload.name ??
          (sourceConfig?.version
            ? `Draft from v${sourceConfig.version}`
            : `Draft ${new Date().toISOString()}`),
        backgroundAssetId: nextBackgroundAssetId,
        backgroundWidth: nextBackgroundWidth,
        backgroundHeight: nextBackgroundHeight,
        layers: nextLayers,
        createdBy: session.user.id,
        basedOnConfigId: sourceConfig?.id ?? null,
      },
    });

    const configs = await listHomepageConfigs();
    const created = configs.find((config) => config.id === createdConfig.id);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/homepage/configs error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
