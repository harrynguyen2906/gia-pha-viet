"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { buildHierarchy } from "./tree/treeUtils";
import { setupDefs, drawLinks, drawSpouseLines, drawNodes } from "@/components/lineage/tree/renderer";
import { renderMiniMap } from "./tree/minimap";
import { MINI_W, MINI_H } from "./tree/constants";
import type { Props, TreeNode, TreeLink, TreeBounds } from "./tree/types";

const COLLAPSE_ANIMATION_MS = 280;

export default function D3LineageTree({
  members,
  onSelectMember,
  selectedMemberId,
  onAddChild,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const miniSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ w: 1200, h: 700 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [showMiniMap, setShowMiniMap] = useState(true);
  const selectedMemberIdRef = useRef<string | null>(selectedMemberId);
  selectedMemberIdRef.current = selectedMemberId;

  // Refs to avoid stale closures inside the zoom handler
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const showMiniMapRef = useRef(showMiniMap);
  showMiniMapRef.current = showMiniMap;

  // Latest tree state for minimap re-renders triggered by zoom events
  const treeStateRef = useRef<{
    nodes: TreeNode[];
    links: TreeLink[];
    bounds: TreeBounds;
  } | null>(null);
  const previousPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Observe container size changes
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ w: width, h: height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Main D3 tree effect
  useEffect(() => {
    if (!svgRef.current || members.length === 0) return;

    const { childrenMap, nodes, links, bounds } = buildHierarchy(members, collapsedNodes);
    treeStateRef.current = { nodes, links, bounds };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", dimensions.w).attr("height", dimensions.h).style("cursor", "grab");

    setupDefs(svg, nodes);

    // ── IMPORTANT: create <g> BEFORE zoom setup to avoid TDZ ReferenceError.
    // When svg.call(zoom.transform, t) fires the zoom handler synchronously,
    // `g` must already be initialized in scope.
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        transformRef.current = event.transform;

        // Re-render mini-map viewport rect on every pan/zoom
        if (
          showMiniMapRef.current &&
          miniSvgRef.current &&
          svgRef.current &&
          zoomRef.current &&
          treeStateRef.current
        ) {
          const { nodes: n, links: l, bounds: b } = treeStateRef.current;
          renderMiniMap(
            miniSvgRef.current, n, l, b,
            event.transform, dimensions,
            svgRef.current, zoomRef.current, selectedMemberId
          );
        }
      });

    zoomRef.current = zoom;
    svg.call(zoom as any);

    // Apply initial centering transform (fires zoom handler → g.attr() is safe now)
    const { minX, minY, totalW, totalH } = bounds;
    const scale = Math.min(dimensions.w / totalW, dimensions.h / totalH, 0.9);
    const initTransform = d3.zoomIdentity
      .translate(
        dimensions.w / 2 - (minX + totalW / 2) * scale,
        dimensions.h / 2 - (minY + totalH / 2) * scale
      )
      .scale(scale);

    svg.call((zoom as any).transform, initTransform);
    transformRef.current = initTransform;

    // Draw tree content into g
    drawLinks(g, links, previousPositionsRef.current, COLLAPSE_ANIMATION_MS);
    drawSpouseLines(g, nodes, previousPositionsRef.current, COLLAPSE_ANIMATION_MS);
    drawNodes(g, nodes, {
      getSelectedMemberId: () => selectedMemberIdRef.current,
      collapsedNodes,
      childrenMap,
      onSelectMember,
      onAddChild,
      setCollapsedNodes,
      previousPositions: previousPositionsRef.current,
      animationMs: COLLAPSE_ANIMATION_MS,
    });

    previousPositionsRef.current = new Map(
      nodes
        .filter((node) => node.data.id !== "__root__")
        .map((node) => [node.data.id, { x: node.x, y: node.y }])
    );

    // Initial mini-map render
    if (showMiniMapRef.current && miniSvgRef.current && svgRef.current && zoomRef.current) {
      renderMiniMap(
        miniSvgRef.current, nodes, links, bounds,
        initTransform, dimensions,
        svgRef.current, zoomRef.current, selectedMemberId
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, dimensions, onSelectMember, onAddChild, collapsedNodes]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    svg.selectAll<SVGGElement, TreeNode>(".node").each(function (d) {
      const isSelected = d.data.id === selectedMemberId;
      d3.select(this)
        .select<SVGRectElement>(".card-rect")
        .attr("fill", () => {
          if (isSelected) return "#8a0000";
          if (d.data.isDeceased) return "#231212";
          return "#1a0808";
        })
        .attr("stroke", isSelected ? "#e5c17c" : "rgba(197,160,89,0.35)")
        .attr("stroke-width", isSelected ? 2 : 1);
    });

    if (
      showMiniMapRef.current &&
      miniSvgRef.current &&
      svgRef.current &&
      zoomRef.current &&
      treeStateRef.current
    ) {
      const { nodes, links, bounds } = treeStateRef.current;
      renderMiniMap(
        miniSvgRef.current,
        nodes,
        links,
        bounds,
        transformRef.current,
        dimensions,
        svgRef.current,
        zoomRef.current,
        selectedMemberId
      );
    }
  }, [selectedMemberId, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/55" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-imperial-crimson/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-antique-gold/10 blur-3xl" />
      </div>
      <svg ref={svgRef} className="w-full h-full" />

      {/* Mini-map overlay */}
      {showMiniMap && (
        <div
          className="absolute bottom-4 right-4 z-10 shadow-2xl"
          style={{
            width: MINI_W,
            background: "rgba(26,8,8,0.92)",
            border: "1px solid rgba(197,160,89,0.3)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 8px",
              borderBottom: "1px solid rgba(197,160,89,0.15)",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "rgba(197,160,89,0.5)",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Mini Map
            </span>
            <button
              onClick={() => setShowMiniMap(false)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(197,160,89,0.4)",
                cursor: "pointer",
                fontSize: 13,
                lineHeight: 1,
                padding: "0 2px",
              }}
            >
              ×
            </button>
          </div>
          <svg ref={miniSvgRef} width={MINI_W} height={MINI_H} />
        </div>
      )}

      {/* Button to restore mini-map */}
      {!showMiniMap && (
        <button
          onClick={() => setShowMiniMap(true)}
          className="absolute bottom-4 right-4 z-10"
          style={{
            background: "rgba(26,8,8,0.92)",
            border: "1px solid rgba(197,160,89,0.3)",
            borderRadius: 6,
            color: "rgba(197,160,89,0.6)",
            fontSize: 10,
            fontFamily: "Cinzel, serif",
            letterSpacing: "0.1em",
            padding: "5px 10px",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Map
        </button>
      )}
    </div>
  );
}

