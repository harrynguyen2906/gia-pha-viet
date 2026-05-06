import { prisma } from "@/lib/prisma";
import { parseHomepageLayers } from "@/lib/homepage/schemas";

export interface PublishedHomepageScene {
  id: string;
  version: number | null;
  backgroundAssetId: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  layers: ReturnType<typeof parseHomepageLayers>;
  publishedAt: string | null;
}

export async function getPublishedHomepageConfig(): Promise<PublishedHomepageScene | null> {
  let config;

  try {
    config = await prisma.homepageConfig.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
      return null;
    }

    throw error;
  }

  if (!config) {
    return null;
  }

  let backgroundAsset;

  try {
    backgroundAsset = await prisma.homepageAsset.findUnique({
      where: { id: config.backgroundAssetId },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
      return null;
    }

    throw error;
  }

  if (!backgroundAsset) {
    return null;
  }

  return {
    id: config.id,
    version: config.version,
    backgroundAssetId: config.backgroundAssetId,
    backgroundUrl: backgroundAsset.publicUrl,
    backgroundWidth: config.backgroundWidth,
    backgroundHeight: config.backgroundHeight,
    layers: parseHomepageLayers(config.layers),
    publishedAt: config.publishedAt?.toISOString() ?? null,
  };
}
