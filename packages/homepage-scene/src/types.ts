export type ScenePreviewMode = "scene" | "desktop" | "mobile";

export interface SceneFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HomepageLayerLink {
  href: string;
  tooltip: string;
  ariaLabel: string;
  external: boolean;
}

export interface HomepageLayerSnapshot {
  id: string;
  assetId: string;
  name: string;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  frame: SceneFrame;
  zIndex: number;
  opacity: number;
  blendMode: "normal" | "screen" | "multiply";
  visible: boolean;
  locked: boolean;
  link: HomepageLayerLink;
}

export interface HomepageSceneSnapshot {
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  layers: HomepageLayerSnapshot[];
}

export interface CoverLayout {
  scale: number;
  renderWidth: number;
  renderHeight: number;
  offsetX: number;
  offsetY: number;
}
