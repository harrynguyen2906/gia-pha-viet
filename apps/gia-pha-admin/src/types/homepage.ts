import type { HomepageLayerSnapshot } from "@gia-pha/homepage-scene";

export type HomepageAssetKind = "BACKGROUND" | "OVERLAY";

export interface HomepageAssetDto {
  id: string;
  kind: HomepageAssetKind;
  fileName: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  hasAlpha: boolean | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HomepageConfigStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface HomepageConfigDto {
  id: string;
  status: HomepageConfigStatus;
  version: number | null;
  name: string;
  backgroundAssetId: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  layers: HomepageLayerSnapshot[];
  createdBy: string;
  publishedBy: string | null;
  publishedAt: string | null;
  basedOnConfigId: string | null;
  createdAt: string;
  updatedAt: string;
}
