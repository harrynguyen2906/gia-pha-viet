"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLineageStore } from "@/store/lineageStore";
import {
  getNodeRadius,
  getNodeColor,
} from "@/lib/brain-graph-transform";
import type { BrainGraphData, BrainNode, BrainLink } from "@/types/brain-graph";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false },
);

interface BrainNodeCanvasProps {
  graphData: BrainGraphData;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onDoubleClickNode?: (nodeId: string) => void;
}

export default function BrainNodeCanvas({
  graphData,
  selectedNodeId,
  onSelectNode,
  onDoubleClickNode,
}: BrainNodeCanvasProps) {
  const graphRef = useRef<any>(null);
  const showLabels = useLineageStore((s) => s.showLabels);
  const toggleLabels = useLineageStore((s) => s.toggleLabels);

  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(
    new Set(),
  );
  const [highlightedLinks, setHighlightedLinks] = useState<Set<BrainLink>>(
    new Set(),
  );
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Double-click detection via click timestamps
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

  // Determine root node (lowest generation)
  const rootNodeId = graphData.nodes.reduce<string | null>((acc, n) => {
    if (!acc) return n.id;
    const accNode = graphData.nodes.find((x) => x.id === acc);
    return n.generation < (accNode?.generation ?? Infinity) ? n.id : acc;
  }, null);

  // Fit all on data change
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => graphRef.current?.zoomToFit(400, 60), 800);
    }
  }, [graphData.nodes.length]);

  // ── Node paint ─────────────────────────────────────────
  const paintNode = useCallback(
    (
      node: BrainNode,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const isRoot = node.id === rootNodeId;
      const isSelected = node.id === selectedNodeId;
      const isHighlighted = highlightedNodes.has(node.id);
      const isHovered = node.id === hoverNodeId;
      const radius =
        getNodeRadius(node, isRoot) * (isHovered && !isSelected ? 1.2 : 1);
      const color = getNodeColor(node, selectedNodeId);

      const nx = node.x!;
      const ny = node.y!;

      // Glow for selected / highlighted
      if (isSelected || isHighlighted) {
        ctx.save();
        ctx.shadowColor = isSelected ? "#e5c17c" : color.fill;
        ctx.shadowBlur = isSelected ? 20 : 10;
        ctx.beginPath();
        ctx.arc(nx, ny, radius + 2, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected
          ? "rgba(229,193,124,0.15)"
          : "rgba(255,255,255,0.05)";
        ctx.fill();
        ctx.restore();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(nx, ny, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color.fill;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? "#e5c17c" : color.border;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      if (showLabels && globalScale >= 0.5) {
        const fontSize = (isHighlighted || isHovered ? 11 : 10) / globalScale;
        ctx.font = `${isHighlighted ? "bold " : ""}${fontSize}px "Noto Sans", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle =
          isHighlighted || isHovered
            ? "rgba(244,235,208,1)"
            : "rgba(244,235,208,0.75)";
        ctx.fillText(
          isHovered ? node.fullName : node.shortName,
          nx,
          ny + radius + 3 / globalScale,
        );
      }
    },
    [selectedNodeId, highlightedNodes, hoverNodeId, showLabels, rootNodeId],
  );

  // ── Link paint ─────────────────────────────────────────
  const paintLink = useCallback(
    (link: BrainLink, ctx: CanvasRenderingContext2D) => {
      const isHighlighted = highlightedLinks.has(link);
      const isSpouse = link.type === "SPOUSE";
      const src = link.source as BrainNode;
      const tgt = link.target as BrainNode;
      if (src.x == null || tgt.x == null) return;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);

      ctx.strokeStyle = isHighlighted
        ? "rgba(229,193,124,0.6)"
        : isSpouse
          ? "rgba(138,0,0,0.35)"
          : "rgba(197,160,89,0.22)";
      ctx.lineWidth = isHighlighted ? 2 : 1;

      if (isSpouse) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [highlightedLinks],
  );

  // ── Interaction ────────────────────────────────────────
  const computeConnections = useCallback(
    (nodeId: string) => {
      const connNodes = new Set<string>();
      const connLinks = new Set<BrainLink>();
      graphData.links.forEach((link) => {
        const sid =
          typeof link.source === "object" ? link.source.id : link.source;
        const tid =
          typeof link.target === "object" ? link.target.id : link.target;
        if (sid === nodeId || tid === nodeId) {
          connNodes.add(sid);
          connNodes.add(tid);
          connLinks.add(link);
        }
      });
      return { connNodes, connLinks };
    },
    [graphData.links],
  );

  const handleNodeClick = useCallback(
    (node: BrainNode) => {
      const now = Date.now();
      const last = lastClickRef.current;
      if (last && last.id === node.id && now - last.time < 350) {
        // Double-click: zoom to node
        graphRef.current?.centerAt(node.x, node.y, 500);
        graphRef.current?.zoom(2.5, 500);
        onDoubleClickNode?.(node.id);
        lastClickRef.current = null;
        return;
      }
      lastClickRef.current = { id: node.id, time: now };

      onSelectNode(node.id);
      const { connNodes, connLinks } = computeConnections(node.id);
      setHighlightedNodes(connNodes);
      setHighlightedLinks(connLinks);
    },
    [onSelectNode, computeConnections, onDoubleClickNode],
  );

  const handleNodeHover = useCallback(
    (node: BrainNode | null) => {
      setHoverNodeId(node?.id ?? null);
      if (node) {
        const { connNodes, connLinks } = computeConnections(node.id);
        setHighlightedNodes(connNodes);
        setHighlightedLinks(connLinks);
      } else if (!selectedNodeId) {
        setHighlightedNodes(new Set());
        setHighlightedLinks(new Set());
      }
    },
    [computeConnections, selectedNodeId],
  );

  const handleBackgroundClick = useCallback(() => {
    if (!hoverNodeId) {
      onSelectNode(null);
      setHighlightedNodes(new Set());
      setHighlightedLinks(new Set());
    }
  }, [onSelectNode, hoverNodeId]);

  const handleNodeDragEnd = useCallback((node: BrainNode) => {
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  // ── Controls ───────────────────────────────────────────
  const zoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300);
  const zoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 300);
  const fitAll = () => graphRef.current?.zoomToFit(400, 40);
  const reCenter = () => {
    graphRef.current?.centerAt(0, 0, 300);
    graphRef.current?.zoom(1, 300);
  };

  // Hierarchical tree layout: BFS from root(s) → assign depth levels → pin fx/fy
  const reLayout = useCallback(() => {
    const fg = graphRef.current;
    if (!fg) return;

    const nodeMap = new Map<string, BrainNode>(
      graphData.nodes.map((n) => [n.id, n]),
    );

    // Build parent→children map (PARENT_CHILD only)
    const childrenOf = new Map<string, string[]>();
    const parentsOf = new Map<string, string[]>();
    graphData.nodes.forEach((n) => {
      childrenOf.set(n.id, []);
      parentsOf.set(n.id, []);
    });
    graphData.links.forEach((link) => {
      if (link.type === "SPOUSE") return;
      // d3 may mutate source/target to objects
      const sid =
        typeof link.source === "object"
          ? (link.source as BrainNode).id
          : (link.source as string);
      const tid =
        typeof link.target === "object"
          ? (link.target as BrainNode).id
          : (link.target as string);
      if (!sid || !tid) return;
      childrenOf.get(sid)?.push(tid);
      parentsOf.get(tid)?.push(sid);
    });

    // Find root nodes (no incoming parent-child edges)
    const roots = graphData.nodes
      .filter((n) => parentsOf.get(n.id)!.length === 0)
      .sort((a, b) => a.generation - b.generation);

    if (roots.length === 0) {
      // Fallback to free simulation
      graphData.nodes.forEach((n) => { n.fx = null; n.fy = null; });
      fg.d3ReheatSimulation();
      setIsSimulating(true);
      setTimeout(() => { setIsSimulating(false); fg.zoomToFit(400, 40); }, 2000);
      return;
    }

    // BFS from roots to assign depth levels
    const depthMap = new Map<string, number>();
    const queue: string[] = [];
    roots.forEach((r) => { depthMap.set(r.id, 0); queue.push(r.id); });

    while (queue.length > 0) {
      const id = queue.shift()!;
      const depth = depthMap.get(id)!;
      (childrenOf.get(id) ?? []).forEach((childId) => {
        if (!depthMap.has(childId)) {
          depthMap.set(childId, depth + 1);
          queue.push(childId);
        }
      });
    }

    // Assign disconnected nodes to an extra level at the bottom
    const maxDepth = depthMap.size > 0 ? Math.max(...depthMap.values()) : 0;
    graphData.nodes.forEach((n) => {
      if (!depthMap.has(n.id)) depthMap.set(n.id, maxDepth + 1);
    });

    // Group nodes by depth
    const levelGroups = new Map<number, string[]>();
    depthMap.forEach((depth, id) => {
      if (!levelGroups.has(depth)) levelGroups.set(depth, []);
      levelGroups.get(depth)!.push(id);
    });

    // Sort within each level so children appear below their parents' x position
    levelGroups.forEach((ids, depth) => {
      if (depth === 0) return;
      const parentLevel = levelGroups.get(depth - 1) ?? [];
      ids.sort((a, b) => {
        const avgIdx = (id: string) => {
          const pIndices = (parentsOf.get(id) ?? [])
            .map((pid) => parentLevel.indexOf(pid))
            .filter((i) => i >= 0);
          return pIndices.length > 0
            ? pIndices.reduce((s, i) => s + i, 0) / pIndices.length
            : Infinity;
        };
        return avgIdx(a) - avgIdx(b);
      });
    });

    // Pin each node to its computed grid position
    const verticalSpacing = 130;
    const horizontalSpacing = 90;

    levelGroups.forEach((nodeIds, depth) => {
      const totalW = (nodeIds.length - 1) * horizontalSpacing;
      nodeIds.forEach((id, idx) => {
        const node = nodeMap.get(id);
        if (node) {
          node.fx = idx * horizontalSpacing - totalW / 2;
          node.fy = depth * verticalSpacing;
        }
      });
    });

    // Reheat so the canvas re-renders with pinned positions
    fg.d3ReheatSimulation();
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      fg.zoomToFit(500, 60);
    }, 1200);
  }, [graphData]);

  return (
    <div className="relative w-full h-full bg-bg-dark overflow-hidden">
      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(26,8,8,0.6) 100%)",
        }}
      />

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData as any}
        backgroundColor="#230f0f"
        nodeCanvasObject={paintNode as any}
        nodeCanvasObjectMode={() => "replace"}
        linkCanvasObject={paintLink as any}
        linkCanvasObjectMode={() => "replace"}
        onNodeClick={handleNodeClick as any}
        onNodeHover={handleNodeHover as any}
        onBackgroundClick={handleBackgroundClick}
        onNodeDragEnd={handleNodeDragEnd as any}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const r = getNodeRadius(node, node.id === rootNodeId) + 4;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fill();
        }}
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
        warmupTicks={100}
        cooldownTicks={200}
        cooldownTime={5000}
        linkDirectionalArrowLength={0}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
        minZoom={0.1}
        maxZoom={5}
      />

      {/* Floating Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
        {[
          { label: "+", title: "Phóng to", action: zoomIn },
          { label: "−", title: "Thu nhỏ", action: zoomOut },
          { label: "⊞", title: "Vừa khung", action: fitAll },
          { label: "⊙", title: "Về trung tâm", action: reCenter },
        ].map(({ label, title, action }) => (
          <button
            key={title}
            onClick={action}
            title={title}
            className="w-9 h-9 rounded bg-lacquer-dark/90 border border-antique-gold/30 text-gold-leaf hover:border-antique-gold/70 hover:bg-lacquer-dark transition-colors text-sm font-header leading-none flex items-center justify-center"
          >
            {label}
          </button>
        ))}

        {/* Re-layout button */}
        <button
          onClick={reLayout}
          disabled={isSimulating}
          title="Sắp xếp lại đồ thị"
          className={`w-9 h-9 rounded border text-xs font-header leading-none flex items-center justify-center transition-colors ${
            isSimulating
              ? "bg-antique-gold/20 border-antique-gold/50 text-gold-leaf cursor-wait"
              : "bg-lacquer-dark/90 border-antique-gold/30 text-gold-leaf hover:border-antique-gold/70 hover:bg-lacquer-dark"
          }`}
        >
          <span
            className={isSimulating ? "inline-block animate-spin" : "inline-block"}
            style={{ fontSize: "14px", lineHeight: 1 }}
          >
            ↻
          </span>
        </button>

        <button
          onClick={toggleLabels}
          title="Bật/tắt nhãn tên"
          className={`w-9 h-9 rounded border text-xs font-header leading-none flex items-center justify-center transition-colors ${
            showLabels
              ? "bg-imperial-crimson/80 border-antique-gold/60 text-gold-leaf"
              : "bg-lacquer-dark/90 border-antique-gold/30 text-parchment/60 hover:border-antique-gold/60"
          }`}
        >
          Aa
        </button>
      </div>

      {/* Node count badge */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <span className="text-xs font-header tracking-widest text-antique-gold/40 uppercase">
          {graphData.nodes.length} thành viên · {graphData.links.length} liên kết
        </span>
      </div>
    </div>
  );
}
