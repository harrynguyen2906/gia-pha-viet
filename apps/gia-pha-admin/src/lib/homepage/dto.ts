import type { HomepageAsset, HomepageConfig } from "@/generated/prisma";
import { parseHomepageLayers } from "@/lib/homepage/schemas";
import type { HomepageAssetDto, HomepageConfigDto } from "@/types/homepage";

export function toHomepageAssetDto(asset: HomepageAsset): HomepageAssetDto {
  return {
    id: asset.id,
    kind: asset.kind,
    fileName: asset.fileName,
    storageKey: asset.storageKey,
    publicUrl: asset.publicUrl,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
    hasAlpha: asset.hasAlpha,
    uploadedBy: asset.uploadedBy,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

export function toHomepageConfigDto(
  config: HomepageConfig,
  backgroundAsset: HomepageAsset
): HomepageConfigDto {
  const layers = parseHomepageLayers(config.layers);

  return {
    id: config.id,
    status: config.status,
    version: config.version,
    name: config.name,
    backgroundAssetId: config.backgroundAssetId,
    backgroundUrl: backgroundAsset.publicUrl,
    backgroundWidth: config.backgroundWidth,
    backgroundHeight: config.backgroundHeight,
    layers,
    createdBy: config.createdBy,
    publishedBy: config.publishedBy,
    publishedAt: config.publishedAt?.toISOString() ?? null,
    basedOnConfigId: config.basedOnConfigId,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}
