import { z } from "zod";

export const homepageLayerLinkSchema = z.object({
  href: z.string().min(1).max(2048),
  tooltip: z.string().max(300),
  ariaLabel: z.string().max(300),
  external: z.boolean(),
});

export const homepageSceneFrameSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
});

export const homepageLayerSnapshotSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().uuid(),
  name: z.string().min(1).max(200),
  imageUrl: z.string().url(),
  naturalWidth: z.number().int().positive(),
  naturalHeight: z.number().int().positive(),
  frame: homepageSceneFrameSchema,
  zIndex: z.number().int(),
  opacity: z.number().min(0).max(1),
  blendMode: z.enum(["normal", "screen", "multiply"]),
  visible: z.boolean(),
  locked: z.boolean(),
  link: homepageLayerLinkSchema,
});

export const homepageLayersSchema = z.array(homepageLayerSnapshotSchema).max(500);

export function parseHomepageLayers(layers: unknown) {
  return homepageLayersSchema.parse(layers);
}
