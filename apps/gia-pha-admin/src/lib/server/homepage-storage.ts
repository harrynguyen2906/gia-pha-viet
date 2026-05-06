import { createClient } from "@supabase/supabase-js";

const HOMEPAGE_BUCKET = "homepage-assets";

export type HomepageStorageKind = "BACKGROUND" | "OVERLAY";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitizeFilename(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
}

export function buildHomepageStorageKey(kind: HomepageStorageKind, originalFileName: string) {
  const folder = kind === "BACKGROUND" ? "backgrounds" : "overlays";
  const safeName = sanitizeFilename(originalFileName || "asset.png");
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

export async function uploadHomepageAsset(params: { kind: HomepageStorageKind; file: File }) {
  const storageKey = buildHomepageStorageKey(params.kind, params.file.name);
  const bytes = new Uint8Array(await params.file.arrayBuffer());

  const { error } = await supabase.storage.from(HOMEPAGE_BUCKET).upload(storageKey, bytes, {
    contentType: params.file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(HOMEPAGE_BUCKET).getPublicUrl(storageKey);

  return { storageKey, publicUrl };
}

export async function deleteHomepageAssetByKey(storageKey: string) {
  const { error } = await supabase.storage.from(HOMEPAGE_BUCKET).remove([storageKey]);
  if (error) {
    throw error;
  }
}
