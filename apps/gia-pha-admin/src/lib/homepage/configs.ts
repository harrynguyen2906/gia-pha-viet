import { prisma } from "@/lib/prisma";
import { toHomepageConfigDto } from "@/lib/homepage/dto";

export async function findHomepageConfigOrNull(id: string) {
  const config = await prisma.homepageConfig.findUnique({ where: { id } });
  if (!config) return null;
  const backgroundAsset = await prisma.homepageAsset.findUnique({
    where: { id: config.backgroundAssetId },
  });
  if (!backgroundAsset) return null;
  return toHomepageConfigDto(config, backgroundAsset);
}

export async function listHomepageConfigs() {
  const configs = await prisma.homepageConfig.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });

  const assetIds = [...new Set(configs.map((config) => config.backgroundAssetId))];
  const assets = await prisma.homepageAsset.findMany({
    where: { id: { in: assetIds } },
  });
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  return configs
    .map((config) => {
      const backgroundAsset = assetsById.get(config.backgroundAssetId);
      if (!backgroundAsset) return null;
      return toHomepageConfigDto(config, backgroundAsset);
    })
    .filter((config): config is NonNullable<typeof config> => Boolean(config));
}
