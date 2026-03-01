"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface MemberNode {
  id: string;
  fullName: string;
  birthYear?: number | null;
  deathYear?: number | null;
  isDeceased: boolean;
  generation?: number | null;
  avatarUrl?: string | null;
  gender?: string | null;
  lineageRole?: string | null;
  parentIds: string[];
  spouseIds: string[];
}

type TreeNode = d3.HierarchyPointNode<MemberNode>;

interface Props {
  members: MemberNode[];
  onSelectMember: (id: string) => void;
  selectedMemberId: string | null;
  onAddChild?: (parentId: string) => void;
}

const NODE_W = 200;
const NODE_H = 80;

// Org-chart elbow connector path
function elbowPath(d: d3.HierarchyPointLink<MemberNode>): string {
  const sx = d.source.x;
  const sy = d.source.y + NODE_H / 2;
  const tx = d.target.x;
  const ty = d.target.y - NODE_H / 2;
  const midY = (sy + ty) / 2;
  return `M ${sx},${sy} V ${midY} H ${tx} V ${ty}`;
}

// Inline SVG path icons for gender
const MALE_ICON =
  "M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z";
const FEMALE_ICON =
  "M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-3.3 0-10 1.7-10 5v1h20v-1c0-3.3-6.7-5-10-5z";
const OTHER_ICON =
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z";

const ROLE_COLORS: Record<string, string> = {
  HEAD_OF_HOUSE: "#e5c17c",
  ELDER: "#cd7f32",
  HEIR: "#c0c0c0",
};

export default function D3LineageTree({ members, onSelectMember, selectedMemberId, onAddChild }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const miniSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 1200, h: 700 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Store refs for zoom + tree data accessible to mini-map
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const treeBoundsRef = useRef({ minX: 0, minY: 0, totalW: 1200, totalH: 700 });
  const treeNodesRef = useRef<TreeNode[]>([]);
  const treeLinksRef = useRef<d3.HierarchyPointLink<MemberNode>[]>([]);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setDimensions({ w: rect.width, h: rect.height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Main tree rendering
  useEffect(() => {
    if (!svgRef.current || members.length === 0) return;

    // ── Build children map from relationships ──────────────────
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const childrenMap = new Map<string, string[]>();
    for (const m of members) {
      for (const pid of m.parentIds) {
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid)!.push(m.id);
      }
    }

    // ── Fix hierarchy bug: use generation to find true roots ──────
    // Only members whose generation equals the minimum in the dataset are roots.
    // Members with parentIds outside the dataset but generation > min are NOT roots.
    const generationsInSet = members
      .map((m) => m.generation)
      .filter((g): g is number => g != null);
    const minGeneration = generationsInSet.length > 0 ? Math.min(...generationsInSet) : 1;

    const roots = members.filter((m) => {
      // Has no parent in dataset at all → only treat as root if generation ≤ minGeneration
      const parentsInDataset = m.parentIds.filter((pid) => memberMap.has(pid));
      if (parentsInDataset.length === 0) {
        return (m.generation ?? minGeneration) <= minGeneration;
      }
      return false;
    });

    // Fallback: if nothing qualifies, pick lowest-generation members
    const effectiveRoots = roots.length > 0
      ? roots
      : members.filter((m) => (m.generation ?? 1) === minGeneration);

    const virtualRoot: MemberNode = {
      id: "__root__",
      fullName: "Tổ Tiên",
      isDeceased: true,
      parentIds: [],
      spouseIds: [],
      generation: minGeneration - 1,
    };

    if (effectiveRoots.length > 1) {
      childrenMap.set("__root__", effectiveRoots.map((r) => r.id));
    }

    const startId = effectiveRoots.length === 1 ? effectiveRoots[0].id : "__root__";
    const allMembers = effectiveRoots.length > 1 ? [virtualRoot, ...members] : members;
    const memberById = new Map(allMembers.map((m) => [m.id, m]));

    // ── Apply collapse: prune collapsed subtrees ──────────────────
    const visited = new Set<string>();
    function getChildren(node: MemberNode): MemberNode[] | undefined {
      if (visited.has(node.id)) return undefined;
      visited.add(node.id);
      // If this node is collapsed, return no children
      if (collapsedNodes.has(node.id)) return undefined;
      const childIds = childrenMap.get(node.id) ?? [];
      const children = childIds
        .map((cid) => memberById.get(cid))
        .filter(Boolean) as MemberNode[];
      return children.length > 0 ? children : undefined;
    }

    const root = d3.hierarchy(memberById.get(startId)!, getChildren);

    const treeLayout = d3.tree<MemberNode>()
      .nodeSize([NODE_W + 24, NODE_H + 70])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8));

    const treeData = treeLayout(root);
    const nodes = treeData.descendants();
    const links = treeData.links();

    treeNodesRef.current = nodes;
    treeLinksRef.current = links;

    // ── Compute viewBox bounds ─────────────────────────────────
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - NODE_W / 2 - 60;
    const maxX = Math.max(...xs) + NODE_W / 2 + 60;
    const minY = Math.min(...ys) - NODE_H / 2 - 60;
    const maxY = Math.max(...ys) + NODE_H / 2 + 80;
    const totalW = maxX - minX;
    const totalH = maxY - minY;
    treeBoundsRef.current = { minX, minY, totalW, totalH };

    // ── SVG setup ─────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("width", dimensions.w)
      .attr("height", dimensions.h)
      .style("cursor", "grab");

    // Defs: filters + clip paths
    const defs = svg.append("defs");

    defs.append("filter")
      .attr("id", "grayscale-filter")
      .append("feColorMatrix")
      .attr("type", "saturate")
      .attr("values", "0.15");

    defs.append("filter")
      .attr("id", "node-glow")
      .html(`
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      `);

    // Per-node avatar clip paths
    nodes
      .filter((n) => n.data.id !== "__root__" && !!n.data.avatarUrl)
      .forEach((n) => {
        defs.append("clipPath")
          .attr("id", `avatar-clip-${n.data.id.replace(/[^a-zA-Z0-9]/g, "_")}`)
          .append("circle")
          .attr("r", 18);
      });

    // ── Zoom + pan ─────────────────────────────────────────────
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        transformRef.current = event.transform;
        renderMiniMap();
      });

    zoomRef.current = zoom;
    svg.call(zoom as any);

    // Initial fit
    const scale = Math.min(dimensions.w / totalW, dimensions.h / totalH, 0.9);
    const initTransform = d3.zoomIdentity
      .translate(
        dimensions.w / 2 - (minX + totalW / 2) * scale,
        dimensions.h / 2 - (minY + totalH / 2) * scale
      )
      .scale(scale);

    svg.call((zoom as any).transform, initTransform);
    transformRef.current = initTransform;

    const g = svg.append("g").attr("transform", initTransform.toString());

    // ── Elbow connector links (LINE-102) ───────────────────────
    g.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", elbowPath)
      .attr("fill", "none")
      .attr("stroke", "rgba(197,160,89,0.35)")
      .attr("stroke-width", 1.5);

    // ── Spouse lines (dashed horizontal) ──────────────────────
    const drawnSpouses = new Set<string>();
    for (const node of nodes) {
      if (node.data.id === "__root__") continue;
      for (const spouseId of node.data.spouseIds) {
        const spouseNode = nodes.find((n) => n.data.id === spouseId);
        const pairKey = [node.data.id, spouseId].sort().join("|");
        if (spouseNode && !drawnSpouses.has(pairKey)) {
          drawnSpouses.add(pairKey);
          g.append("line")
            .attr("x1", node.x)
            .attr("y1", node.y)
            .attr("x2", spouseNode.x)
            .attr("y2", spouseNode.y)
            .attr("stroke", "rgba(197,160,89,0.45)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "6 4");
        }
      }
    }

    // ── Node groups ───────────────────────────────────────────
    const nodeGroups = g.selectAll(".node")
      .data(nodes.filter((n) => n.data.id !== "__root__"))
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (_event, d) => onSelectMember(d.data.id));

    // ── Card background rect (LINE-104) ───────────────────────
    nodeGroups.append("rect")
      .attr("x", -NODE_W / 2)
      .attr("y", -NODE_H / 2)
      .attr("width", NODE_W)
      .attr("height", NODE_H)
      .attr("rx", 4)
      .attr("fill", (d) => {
        if (d.data.id === selectedMemberId) return "#8a0000";
        if (d.data.isDeceased) return "#231212";
        return "#1a0808";
      })
      .attr("stroke", (d) =>
        d.data.id === selectedMemberId ? "#e5c17c" : "rgba(197,160,89,0.35)"
      )
      .attr("stroke-width", (d) => (d.data.id === selectedMemberId ? 2 : 1))
      .attr("filter", (d) => (d.data.isDeceased ? "url(#grayscale-filter)" : null));

    // ── Avatar circle bg ──────────────────────────────────────
    nodeGroups.append("circle")
      .attr("cx", -NODE_W / 2 + 28)
      .attr("cy", 0)
      .attr("r", 20)
      .attr("fill", "rgba(197,160,89,0.1)")
      .attr("stroke", "rgba(197,160,89,0.3)")
      .attr("stroke-width", 1)
      .attr("filter", (d) => (d.data.isDeceased ? "url(#grayscale-filter)" : null));

    // ── Avatar image (when available) ─────────────────────────
    nodeGroups.filter((d) => !!d.data.avatarUrl)
      .append("image")
      .attr("href", (d) => d.data.avatarUrl!)
      .attr("x", -NODE_W / 2 + 10)
      .attr("y", -18)
      .attr("width", 36)
      .attr("height", 36)
      .attr("clip-path", (d) =>
        `url(#avatar-clip-${d.data.id.replace(/[^a-zA-Z0-9]/g, "_")})`
      )
      .attr("filter", (d) => (d.data.isDeceased ? "url(#grayscale-filter)" : null));

    // ── Gender icon SVG path (when no avatar) ─────────────────
    nodeGroups.filter((d) => !d.data.avatarUrl)
      .append("svg")
      .attr("x", -NODE_W / 2 + 10)
      .attr("y", -18)
      .attr("width", 36)
      .attr("height", 36)
      .attr("viewBox", "0 0 24 24")
      .append("path")
      .attr("d", (d) => {
        if (d.data.gender === "FEMALE") return FEMALE_ICON;
        if (d.data.gender === "OTHER") return OTHER_ICON;
        return MALE_ICON;
      })
      .attr("fill", (d) =>
        d.data.isDeceased ? "rgba(197,160,89,0.35)" : "rgba(197,160,89,0.65)"
      );

    // ── Role badge (top-right corner) ─────────────────────────
    nodeGroups
      .filter((d) => !!(d.data.lineageRole && ROLE_COLORS[d.data.lineageRole]))
      .append("circle")
      .attr("cx", NODE_W / 2 - 12)
      .attr("cy", -NODE_H / 2 + 12)
      .attr("r", 5)
      .attr("fill", (d) => ROLE_COLORS[d.data.lineageRole!] ?? "transparent")
      .attr("stroke", "rgba(26,8,8,0.8)")
      .attr("stroke-width", 1);

    // ── Name text ─────────────────────────────────────────────
    nodeGroups.append("text")
      .attr("x", -NODE_W / 2 + 58)
      .attr("y", -10)
      .attr("font-family", "Cinzel, serif")
      .attr("font-size", "11px")
      .attr("fill", (d) =>
        d.data.isDeceased ? "rgba(244,235,208,0.6)" : "#f4ebd0"
      )
      .text((d) =>
        d.data.fullName.length > 16
          ? d.data.fullName.slice(0, 14) + "…"
          : d.data.fullName
      );

    // ── Years text ────────────────────────────────────────────
    nodeGroups.append("text")
      .attr("x", -NODE_W / 2 + 58)
      .attr("y", 8)
      .attr("font-family", "Noto Sans, sans-serif")
      .attr("font-size", "10px")
      .attr("fill", "rgba(197,160,89,0.7)")
      .text((d) => {
        const b = d.data.birthYear ?? "?";
        if (d.data.isDeceased) return `${b} – ${d.data.deathYear ?? "?"}`;
        return String(b);
      });

    // ── Generation badge ──────────────────────────────────────
    nodeGroups.append("text")
      .attr("x", -NODE_W / 2 + 58)
      .attr("y", 24)
      .attr("font-family", "Noto Sans, sans-serif")
      .attr("font-size", "9px")
      .attr("fill", "rgba(197,160,89,0.4)")
      .text((d) => (d.data.generation ? `Đời ${d.data.generation}` : ""));

    // ── Deceased cross mark ───────────────────────────────────
    nodeGroups.filter((d) => d.data.isDeceased)
      .append("text")
      .attr("x", NODE_W / 2 - 28)
      .attr("y", -NODE_H / 2 + 14)
      .attr("font-size", "10px")
      .attr("fill", "rgba(197,160,89,0.5)")
      .text("✝");

    // ── Hover effects ─────────────────────────────────────────
    nodeGroups
      .on("mouseenter", function (_e, d) {
        d3.select(this).select(".card-rect")
          .attr("stroke", d.data.id === selectedMemberId
            ? "#e5c17c"
            : "rgba(197,160,89,0.7)"
          );
        if (onAddChild) {
          d3.select(this).select(".add-child-btn")
            .transition().duration(150)
            .style("opacity", 1)
            .style("pointer-events", "all");
        }
      })
      .on("mouseleave", function (_e, d) {
        d3.select(this).select(".card-rect")
          .attr("stroke", d.data.id === selectedMemberId
            ? "#e5c17c"
            : "rgba(197,160,89,0.35)"
          );
        if (onAddChild) {
          d3.select(this).select(".add-child-btn")
            .transition().duration(150)
            .style("opacity", 0)
            .style("pointer-events", "none");
        }
      });

    // Re-apply class to card rect so hover can find it
    nodeGroups.select("rect").attr("class", "card-rect");

    // ── Collapse/Expand button (LINE-103) ─────────────────────
    // Count total descendants (including those outside collapsed subtrees)
    function countAllDescendants(nodeId: string): number {
      const childIds = childrenMap.get(nodeId) ?? [];
      return childIds.reduce(
        (sum, cid) => sum + 1 + countAllDescendants(cid),
        0
      );
    }

    const nodesWithChildren = nodes.filter(
      (d) =>
        d.data.id !== "__root__" &&
        (childrenMap.get(d.data.id)?.length ?? 0) > 0
    );

    const collapseBtnGroups = nodeGroups.filter(
      (d) => d.data.id !== "__root__" &&
        (childrenMap.get(d.data.id)?.length ?? 0) > 0
    );

    collapseBtnGroups
      .append("circle")
      .attr("class", "collapse-btn")
      .attr("cy", NODE_H / 2 + 10)
      .attr("cx", 0)
      .attr("r", 9)
      .attr("fill", "#1a0808")
      .attr("stroke", "rgba(197,160,89,0.45)")
      .attr("stroke-width", 1)
      .style("cursor", "pointer");

    collapseBtnGroups
      .append("text")
      .attr("class", "collapse-icon")
      .attr("y", NODE_H / 2 + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "rgba(197,160,89,0.8)")
      .attr("pointer-events", "none")
      .text((d) => (collapsedNodes.has(d.data.id) ? "▸" : "▾"));

    // Hidden count badge when collapsed
    nodesWithChildren.forEach((d) => {
      if (collapsedNodes.has(d.data.id)) {
        const count = countAllDescendants(d.data.id);
        const nodeG = g.selectAll<SVGGElement, TreeNode>(".node")
          .filter((n) => n.data.id === d.data.id);
        nodeG.append("text")
          .attr("x", 14)
          .attr("y", NODE_H / 2 + 14)
          .attr("font-size", "8px")
          .attr("fill", "rgba(197,160,89,0.6)")
          .attr("pointer-events", "none")
          .text(`+${count}`);
      }
    });

    // Collapse button click
    collapseBtnGroups.select(".collapse-btn")
      .on("click", (event, d) => {
        event.stopPropagation();
        setCollapsedNodes((prev) => {
          const next = new Set(prev);
          next.has(d.data.id) ? next.delete(d.data.id) : next.add(d.data.id);
          return next;
        });
      });

    // ── Add-child hover button (LINE-106) ─────────────────────
    if (onAddChild) {
      const addBtnGroups = nodeGroups.append("g")
        .attr("class", "add-child-btn")
        .attr("transform", `translate(0, ${NODE_H / 2 + 30})`)
        .style("opacity", 0)
        .style("pointer-events", "none");

      addBtnGroups.append("circle")
        .attr("r", 11)
        .attr("fill", "#8a0000")
        .attr("stroke", "rgba(197,160,89,0.5)")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer");

      addBtnGroups.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.38em")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .attr("fill", "#f4ebd0")
        .attr("pointer-events", "none")
        .text("+");

      addBtnGroups.on("click", (event, d) => {
        event.stopPropagation();
        onAddChild(d.data.id);
      });
    }

    // ── Mini-map render function (LINE-105) ───────────────────
    function renderMiniMap() {
      if (!miniSvgRef.current || !showMiniMap) return;

      const { minX: bMinX, minY: bMinY, totalW: bW, totalH: bH } = treeBoundsRef.current;
      const miniSvg = d3.select(miniSvgRef.current);
      miniSvg.selectAll("*").remove();

      const miniW = 220;
      const miniH = 140;
      const scaleX = miniW / bW;
      const scaleY = miniH / bH;
      const s = Math.min(scaleX, scaleY) * 0.9;
      const offsetX = (miniW - bW * s) / 2 - bMinX * s;
      const offsetY = (miniH - bH * s) / 2 - bMinY * s;

      const mg = miniSvg.append("g").attr("transform", `translate(${offsetX},${offsetY}) scale(${s})`);

      // Simplified links
      mg.selectAll("line.ml")
        .data(treeLinksRef.current)
        .join("line")
        .attr("class", "ml")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)
        .attr("stroke", "rgba(197,160,89,0.2)")
        .attr("stroke-width", 0.5 / s);

      // Simplified nodes
      mg.selectAll("rect.mn")
        .data(treeNodesRef.current.filter((n) => n.data.id !== "__root__"))
        .join("rect")
        .attr("class", "mn")
        .attr("x", (d) => d.x - NODE_W / 2)
        .attr("y", (d) => d.y - NODE_H / 2)
        .attr("width", NODE_W)
        .attr("height", NODE_H)
        .attr("rx", 4 / s)
        .attr("fill", (d) =>
          d.data.id === selectedMemberId
            ? "rgba(138,0,0,0.8)"
            : d.data.isDeceased
            ? "rgba(197,160,89,0.2)"
            : "rgba(197,160,89,0.45)"
        );

      // Viewport rect
      const t = transformRef.current;
      const vx = (-t.x) / t.k + bMinX;
      const vy = (-t.y) / t.k + bMinY;
      const vw = dimensions.w / t.k;
      const vh = dimensions.h / t.k;

      mg.append("rect")
        .attr("x", vx)
        .attr("y", vy)
        .attr("width", vw)
        .attr("height", vh)
        .attr("fill", "rgba(138,0,0,0.12)")
        .attr("stroke", "#8a0000")
        .attr("stroke-width", 2 / s);

      // Click to pan
      miniSvg.style("cursor", "crosshair").on("click", function (event) {
        const [px, py] = d3.pointer(event);
        const worldX = (px - offsetX) / s;
        const worldY = (py - offsetY) / s;
        const currentK = transformRef.current.k;
        const newT = d3.zoomIdentity
          .translate(
            dimensions.w / 2 - worldX * currentK,
            dimensions.h / 2 - worldY * currentK
          )
          .scale(currentK);
        d3.select(svgRef.current!)
          .transition()
          .duration(300)
          .call((zoomRef.current as any).transform, newT);
      });
    }

    renderMiniMap();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, dimensions, selectedMemberId, onSelectMember, onAddChild, collapsedNodes]);

  // Re-render mini-map when showMiniMap toggles
  useEffect(() => {
    if (!miniSvgRef.current) return;
    if (!showMiniMap) {
      d3.select(miniSvgRef.current).selectAll("*").remove();
    }
  }, [showMiniMap]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Mini-map overlay (LINE-105) */}
      {showMiniMap && (
        <div
          className="absolute bottom-4 right-4 z-10 shadow-2xl"
          style={{
            width: 220,
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
          <svg ref={miniSvgRef} width={220} height={140} />
        </div>
      )}

      {/* Button to re-open mini-map */}
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

