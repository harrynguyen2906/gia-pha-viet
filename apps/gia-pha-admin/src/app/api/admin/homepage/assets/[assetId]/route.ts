import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getHomepageSession, isSuperAdmin } from "@/lib/homepage/auth";
import { parseHomepageLayers } from "@/lib/homepage/schemas";
import { deleteHomepageAssetByKey } from "@/lib/server/homepage-storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const session = await getHomepageSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const { assetId } = await params;
    const asset = await prisma.homepageAsset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const configs = await prisma.homepageConfig.findMany({
      select: { id: true, backgroundAssetId: true, layers: true, status: true },
    });

    const usedAsBackground = configs.some((config) => config.backgroundAssetId === asset.id);
    const usedInLayers = configs.some((config) =>
      parseHomepageLayers(config.layers).some((layer) => layer.assetId === asset.id)
    );

    if (usedAsBackground || usedInLayers) {
      return NextResponse.json(
        { error: "Asset is in use by one or more homepage configs" },
        { status: 409 }
      );
    }

    await deleteHomepageAssetByKey(asset.storageKey);
    await prisma.homepageAsset.delete({ where: { id: asset.id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/homepage/assets/[assetId] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
