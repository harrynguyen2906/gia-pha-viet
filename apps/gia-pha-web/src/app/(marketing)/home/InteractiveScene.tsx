'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './home.module.css';

interface LayerConfig {
  imgSrc: string;
  href: string;
  tooltip: string;
  ariaLabel: string;
  layerClass: string;
  external?: boolean;
}

const layers: LayerConfig[] = [
  {
    imgSrc: '/homepage/3.png',
    href: '/giapha',
    tooltip: 'Cây Đa — Gia Phả Online',
    ariaLabel: 'Go to gia pha landing page',
    layerClass: 'layer1',
  },
  {
    imgSrc: '/homepage/4.png',
    href: '/giapha',
    tooltip: 'Nhà Thờ Họ — Gia Phả Online',
    ariaLabel: 'Go to gia pha ho toc landing page',
    layerClass: 'layer2',
  },
  {
    imgSrc: '/homepage/5.png',
    href: 'https://viengchua.io.vn',
    tooltip: 'Chùa Online — viengchua.io.vn',
    ariaLabel: 'Open Pagoda Online at viengchua.io.vn',
    layerClass: 'layer3',
    external: true,
  },
  {
    imgSrc: '/homepage/6.png',
    href: 'https://viengchua.io.vn',
    tooltip: 'Hồ Sen — viengchua.io.vn',
    ariaLabel: 'Open Pagoda Online pond area',
    layerClass: 'layer4',
    external: true,
  },
];

/**
 * Canvas-based alpha hit-testing for transparent PNG overlays.
 * Only triggers hover/click when the cursor is over opaque pixels.
 */
export default function InteractiveScene() {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const elRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  // Load each layer image into an offscreen canvas for pixel sampling
  useEffect(() => {
    layers.forEach((layer, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = layer.imgSrc;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvasRefs.current[i] = canvas;
        }
      };
    });
  }, []);

  /** Check if (clientX, clientY) hits an opaque pixel in the given layer */
  const checkAlpha = useCallback(
    (layerIndex: number, clientX: number, clientY: number): boolean => {
      const canvas = canvasRefs.current[layerIndex];
      const el = elRefs.current[layerIndex];
      if (!canvas || !el) return false;

      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return false;

      const cx = Math.floor((x / rect.width) * canvas.width);
      const cy = Math.floor((y / rect.height) * canvas.height);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return false;

      const pixel = ctx.getImageData(cx, cy, 1, 1).data;
      return pixel[3] > 20; // alpha threshold
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Check layers in DOM order (layer1 has higher z-index → check first)
      for (let i = 0; i < layers.length; i++) {
        if (checkAlpha(i, e.clientX, e.clientY)) {
          setActiveLayer(i);
          return;
        }
      }
      setActiveLayer(null);
    },
    [checkAlpha],
  );

  const handleClick = useCallback(() => {
    if (activeLayer === null) return;
    const layer = layers[activeLayer];
    if (layer.external) {
      window.open(layer.href, '_blank', 'noopener');
    } else {
      window.location.href = layer.href;
    }
  }, [activeLayer]);

  return (
    <>
      {/* Invisible hit-test overlay — captures all mouse events */}
      <div
        className={styles.hitOverlay}
        style={{ cursor: activeLayer !== null ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setActiveLayer(null)}
        onClick={handleClick}
      />

      {/* Visual layers (pointer-events: none — controlled by hit overlay) */}
      {layers.map((layer, i) => {
        const isActive = activeLayer === i;
        return (
          <span
            key={layer.layerClass}
            ref={(el) => { elRefs.current[i] = el; }}
            className={[
              styles.targetObject,
              styles[layer.layerClass],
              isActive ? styles.hovered : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-tooltip={layer.tooltip}
            aria-label={layer.ariaLabel}
            style={
              { '--mask-img': `url('${layer.imgSrc}')` } as React.CSSProperties
            }
          >
            <img
              src={layer.imgSrc}
              alt={layer.ariaLabel}
              className={styles.objectImg}
              loading="eager"
              decoding="async"
            />
          </span>
        );
      })}
    </>
  );
}
