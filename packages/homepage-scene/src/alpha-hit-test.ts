import type { HomepageLayerSnapshot, SceneFrame } from "./types";

export interface LayerHitTestInput {
  layer: HomepageLayerSnapshot;
  frame: SceneFrame;
}

export function sortLayersForHitTesting(layers: HomepageLayerSnapshot[]): HomepageLayerSnapshot[] {
  return layers
    .filter((layer) => layer.visible)
    .sort((a, b) => {
      if (a.zIndex === b.zIndex) {
        return a.id < b.id ? 1 : -1;
      }
      return b.zIndex - a.zIndex;
    });
}

export function isPointInsideFrame(frame: SceneFrame, x: number, y: number): boolean {
  return x >= frame.x && y >= frame.y && x <= frame.x + frame.width && y <= frame.y + frame.height;
}

export function mapPointToImagePixel(
  frame: SceneFrame,
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number
) {
  const dx = x - frame.x;
  const dy = y - frame.y;
  const px = Math.floor((dx / frame.width) * imageWidth);
  const py = Math.floor((dy / frame.height) * imageHeight);

  return {
    x: Math.max(0, Math.min(px, imageWidth - 1)),
    y: Math.max(0, Math.min(py, imageHeight - 1)),
  };
}
