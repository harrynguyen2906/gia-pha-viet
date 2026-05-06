import type { CoverLayout, SceneFrame } from "./types";

export function getCoverLayout(
  sceneWidth: number,
  sceneHeight: number,
  viewportWidth: number,
  viewportHeight: number
): CoverLayout {
  if (sceneWidth <= 0 || sceneHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) {
    return {
      scale: 1,
      renderWidth: sceneWidth,
      renderHeight: sceneHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }

  const scale = Math.max(viewportWidth / sceneWidth, viewportHeight / sceneHeight);
  const renderWidth = sceneWidth * scale;
  const renderHeight = sceneHeight * scale;
  const offsetX = (viewportWidth - renderWidth) / 2;
  const offsetY = (viewportHeight - renderHeight) / 2;

  return { scale, renderWidth, renderHeight, offsetX, offsetY };
}

export function sceneFrameToViewportFrame(frame: SceneFrame, layout: CoverLayout): SceneFrame {
  return {
    x: layout.offsetX + frame.x * layout.scale,
    y: layout.offsetY + frame.y * layout.scale,
    width: frame.width * layout.scale,
    height: frame.height * layout.scale,
  };
}

export function viewportPointToScene(
  clientX: number,
  clientY: number,
  viewportLeft: number,
  viewportTop: number,
  layout: CoverLayout
) {
  return {
    x: (clientX - viewportLeft - layout.offsetX) / layout.scale,
    y: (clientY - viewportTop - layout.offsetY) / layout.scale,
  };
}

export function clampSceneFrame(
  frame: SceneFrame,
  sceneWidth: number,
  sceneHeight: number
): SceneFrame {
  const width = Math.max(1, Math.min(frame.width, sceneWidth));
  const height = Math.max(1, Math.min(frame.height, sceneHeight));

  return {
    x: Math.max(-width + 1, Math.min(frame.x, sceneWidth - 1)),
    y: Math.max(-height + 1, Math.min(frame.y, sceneHeight - 1)),
    width,
    height,
  };
}
