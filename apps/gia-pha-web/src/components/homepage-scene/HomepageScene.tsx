"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCoverLayout,
  sceneFrameToViewportFrame,
  sortLayersForHitTesting,
  type HomepageLayerSnapshot,
} from "@gia-pha/homepage-scene";
import styles from "./HomepageScene.module.css";

interface HomepageSceneProps {
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  layers: HomepageLayerSnapshot[];
}

type Size = { width: number; height: number };

export function HomepageScene({
  backgroundUrl,
  backgroundWidth,
  backgroundHeight,
  layers,
}: HomepageSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const alphaCanvases = useRef<Record<string, HTMLCanvasElement>>({});
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 });
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const drawOrder = useMemo(
    () =>
      [...layers]
        .filter((layer) => layer.visible)
        .sort((a, b) => (a.zIndex === b.zIndex ? a.id.localeCompare(b.id) : a.zIndex - b.zIndex)),
    [layers]
  );

  const hitOrder = useMemo(() => sortLayersForHitTesting(layers), [layers]);

  const coverLayout = useMemo(
    () =>
      getCoverLayout(backgroundWidth, backgroundHeight, containerSize.width, containerSize.height),
    [backgroundWidth, backgroundHeight, containerSize.width, containerSize.height]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    layers.forEach((layer) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = layer.imageUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || layer.naturalWidth;
        canvas.height = img.naturalHeight || layer.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        alphaCanvases.current[layer.id] = canvas;
      };
    });
  }, [layers]);

  const checkAlpha = useCallback(
    (layer: HomepageLayerSnapshot, clientX: number, clientY: number) => {
      const layerEl = layerRefs.current[layer.id];
      const canvas = alphaCanvases.current[layer.id];
      if (!layerEl || !canvas) return false;

      const rect = layerEl.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientY < rect.top ||
        clientX >= rect.right ||
        clientY >= rect.bottom
      ) {
        return false;
      }

      const xInLayer = clientX - rect.left;
      const yInLayer = clientY - rect.top;
      const px = Math.floor((xInLayer / rect.width) * canvas.width);
      const py = Math.floor((yInLayer / rect.height) * canvas.height);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;

      const alpha = ctx.getImageData(px, py, 1, 1).data[3];
      return alpha > 20;
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      for (const layer of hitOrder) {
        if (checkAlpha(layer, event.clientX, event.clientY)) {
          setActiveLayerId(layer.id);
          return;
        }
      }
      setActiveLayerId(null);
    },
    [checkAlpha, hitOrder]
  );

  const handleClick = useCallback(() => {
    if (!activeLayerId) return;
    const layer = layers.find((item) => item.id === activeLayerId);
    if (!layer) return;

    if (layer.link.external) {
      window.open(layer.link.href, "_blank", "noopener");
      return;
    }
    window.location.href = layer.link.href;
  }, [activeLayerId, layers]);

  return (
    <div ref={containerRef} className={styles.sceneRoot}>
      <img src={backgroundUrl} alt="Background landscape" className={styles.backgroundImage} />

      <div
        className={styles.hitOverlay}
        style={{ cursor: activeLayerId ? "pointer" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setActiveLayerId(null)}
        onClick={handleClick}
      />

      {drawOrder.map((layer) => {
        const viewportFrame = sceneFrameToViewportFrame(layer.frame, coverLayout);
        const isActive = activeLayerId === layer.id;
        return (
          <span
            key={layer.id}
            ref={(node) => {
              layerRefs.current[layer.id] = node;
            }}
            className={[styles.layer, isActive ? styles.hovered : ""].filter(Boolean).join(" ")}
            data-tooltip={layer.link.tooltip}
            style={
              {
                left: `${viewportFrame.x}px`,
                top: `${viewportFrame.y}px`,
                width: `${viewportFrame.width}px`,
                height: `${viewportFrame.height}px`,
                zIndex: layer.zIndex + 10,
                "--mask-img": `url('${layer.imageUrl}')`,
                "--layer-opacity": layer.opacity,
                "--layer-blend-mode": layer.blendMode,
              } as React.CSSProperties
            }
            aria-label={layer.link.ariaLabel}
          >
            <img src={layer.imageUrl} alt={layer.link.ariaLabel} className={styles.layerImg} />
          </span>
        );
      })}
    </div>
  );
}
