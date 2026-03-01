"use client";

import { useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { getNodeColor } from "@/lib/brain-graph-transform";
import type { BrainGraphData, BrainNode } from "@/types/brain-graph";

const MINIMAP_W = 240;
const MINIMAP_H = 170;
const PADDING = 12;

interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

interface BrainMiniMapProps {
  graphData: BrainGraphData;
  viewport: ViewportState;
  onNavigate: (graphX: number, graphY: number) => void;
  visible: boolean;
  onToggle: () => void;
}

export default function BrainMiniMap({
  graphData,
  viewport,
  onNavigate,
  visible,
  onToggle,
}: BrainMiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Compute graph bounds from nodes
  const getGraphBounds = useCallback(() => {
    const nodes = graphData.nodes.filter((n) => n.x != null && n.y != null);
    if (nodes.length === 0)
      return { minX: -200, minY: -200, maxX: 200, maxY: 200 };
    const xs = nodes.map((n) => n.x!);
    const ys = nodes.map((n) => n.y!);
    return {
      minX: Math.min(...xs) - 40,
      minY: Math.min(...ys) - 40,
      maxX: Math.max(...xs) + 40,
      maxY: Math.max(...ys) + 40,
    };
  }, [graphData.nodes]);

  // Draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bounds = getGraphBounds();
    const gW = bounds.maxX - bounds.minX;
    const gH = bounds.maxY - bounds.minY;
    if (gW <= 0 || gH <= 0) return;

    const drawW = MINIMAP_W - PADDING * 2;
    const drawH = MINIMAP_H - PADDING * 2 - 20; // 20px header
    const scale = Math.min(drawW / gW, drawH / gH);
    const offsetX = PADDING + (drawW - gW * scale) / 2;
    const offsetY = PADDING + 20 + (drawH - gH * scale) / 2;

    const graphToMini = (gx: number, gy: number) => ({
      mx: offsetX + (gx - bounds.minX) * scale,
      my: offsetY + (gy - bounds.minY) * scale,
    });

    // Clear
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

    // Background
    ctx.fillStyle = "rgba(26,8,8,0.95)";
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

    // Draw edges (simplified)
    graphData.links.forEach((link) => {
      const src = link.source as BrainNode;
      const tgt = link.target as BrainNode;
      if (src.x == null || tgt.x == null) return;
      const s = graphToMini(src.x, src.y!);
      const t = graphToMini(tgt.x, tgt.y!);
      ctx.beginPath();
      ctx.moveTo(s.mx, s.my);
      ctx.lineTo(t.mx, t.my);
      ctx.strokeStyle = "rgba(197,160,89,0.15)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Draw nodes (simplified dots)
    const visible50 = graphData.nodes.length > 500
      ? graphData.nodes.filter((_, i) => i % 2 === 0)
      : graphData.nodes;

    visible50.forEach((node) => {
      if (node.x == null) return;
      const { mx, my } = graphToMini(node.x, node.y!);
      const color = getNodeColor(node, null);
      ctx.beginPath();
      ctx.arc(mx, my, node.connectionCount > 3 ? 3.5 : 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = color.fill;
      ctx.fill();
    });

    // Draw viewport rect
    const vpW = viewport.width / viewport.zoom;
    const vpH = viewport.height / viewport.zoom;
    const vpCenterX = -viewport.x / viewport.zoom;
    const vpCenterY = -viewport.y / viewport.zoom;
    const vp = graphToMini(vpCenterX - vpW / 2, vpCenterY - vpH / 2);
    const vpEndX = vp.mx + vpW * scale;
    const vpEndY = vp.my + vpH * scale;

    ctx.strokeStyle = "rgba(138,0,0,0.9)";
    ctx.lineWidth = 1.5;
    ctx.fillStyle = "rgba(138,0,0,0.08)";
    ctx.beginPath();
    ctx.rect(vp.mx, vp.my, vpEndX - vp.mx, vpEndY - vp.my);
    ctx.fill();
    ctx.stroke();
  }, [graphData, getGraphBounds, viewport]);

  // Throttled redraw
  useEffect(() => {
    if (!visible) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw, visible]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const bounds = getGraphBounds();
      const gW = bounds.maxX - bounds.minX;
      const gH = bounds.maxY - bounds.minY;
      if (gW <= 0 || gH <= 0) return;

      const drawW = MINIMAP_W - PADDING * 2;
      const drawH = MINIMAP_H - PADDING * 2 - 20;
      const scale = Math.min(drawW / gW, drawH / gH);
      const offsetX = PADDING + (drawW - gW * scale) / 2;
      const offsetY = PADDING + 20 + (drawH - gH * scale) / 2;

      const graphX = bounds.minX + (clickX - offsetX) / scale;
      const graphY = bounds.minY + (clickY - offsetY) / scale;
      onNavigate(graphX, graphY);
    },
    [getGraphBounds, onNavigate],
  );

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        title="Mở bản đồ thu nhỏ"
        className="absolute bottom-4 right-4 z-20 w-10 h-10 bg-lacquer-dark/90 border border-antique-gold/30 rounded text-lg flex items-center justify-center text-gold-leaf hover:border-antique-gold/60 transition-colors"
      >
        🗺️
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-4 right-4 z-20 rounded-lg overflow-hidden border border-antique-gold/25"
      style={{
        width: MINIMAP_W,
        background: "rgba(26,8,8,0.92)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-antique-gold/10">
        <span className="text-[9px] font-header tracking-widest uppercase text-antique-gold/40">
          Mini Map
        </span>
        <button
          onClick={onToggle}
          className="text-parchment/30 hover:text-parchment/70 transition-colors"
          aria-label="Đóng mini map"
        >
          <X className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        onClick={handleClick}
        className="cursor-crosshair block"
        style={{ height: MINIMAP_H }}
      />
    </div>
  );
}
