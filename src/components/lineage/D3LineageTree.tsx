"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
  parentIds: string[];
  spouseIds: string[];
}

interface TreeNode extends d3.HierarchyPointNode<MemberNode> {}

interface Props {
  members: MemberNode[];
  onSelectMember: (id: string) => void;
  selectedMemberId: string | null;
}

const NODE_W = 160;
const NODE_H = 70;

export default function D3LineageTree({ members, onSelectMember, selectedMemberId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 1200, h: 700 });

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setDimensions({ w: rect.width, h: rect.height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || members.length === 0) return;

    // Build tree hierarchy from flat member list.
    // Find root(s) = members with no parent in our set.
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const allParentIds = new Set(members.flatMap((m) => m.parentIds));
    const roots = members.filter((m) => !allParentIds.has(m.id) || m.parentIds.every((p) => !memberMap.has(p)));

    // Create a virtual root if multiple roots found
    const virtualRoot: MemberNode = {
      id: "__root__",
      fullName: "Tổ Tiên",
      isDeceased: true,
      parentIds: [],
      spouseIds: [],
      generation: 0,
    };

    // Build children map
    const childrenMap = new Map<string, string[]>();
    for (const m of members) {
      for (const pid of m.parentIds) {
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid)!.push(m.id);
      }
    }
    if (roots.length > 1) {
      childrenMap.set("__root__", roots.map((r) => r.id));
    }

    const startId = roots.length === 1 ? roots[0].id : "__root__";
    const allMembers = roots.length > 1 ? [virtualRoot, ...members] : members;
    const memberById = new Map(allMembers.map((m) => [m.id, m]));

    const visited = new Set<string>();
    function getChildren(node: MemberNode): MemberNode[] | undefined {
      if (visited.has(node.id)) return undefined; // prevent cycles
      visited.add(node.id);
      const childIds = childrenMap.get(node.id) ?? [];
      const children = childIds
        .map((cid) => memberById.get(cid))
        .filter(Boolean) as MemberNode[];
      return children.length > 0 ? children : undefined;
    }

    const root = d3.hierarchy(memberById.get(startId)!, getChildren);

    const treeLayout = d3.tree<MemberNode>()
      .nodeSize([NODE_W + 20, NODE_H + 60])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8));

    const treeData = treeLayout(root);
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Dimensions
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - NODE_W / 2 - 40;
    const maxX = Math.max(...xs) + NODE_W / 2 + 40;
    const minY = Math.min(...ys) - NODE_H / 2 - 40;
    const maxY = Math.max(...ys) + NODE_H / 2 + 40;
    const totalW = maxX - minX;
    const totalH = maxY - minY;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("width", dimensions.w)
      .attr("height", dimensions.h)
      .attr("viewBox", `${minX} ${minY} ${totalW} ${totalH}`)
      .style("cursor", "grab");

    // Zoom + pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom as any);

    const g = svg.append("g");

    // Links
    const linkPath = d3.linkVertical<d3.HierarchyPointLink<MemberNode>, d3.HierarchyPointNode<MemberNode>>()
      .x((d) => d.x)
      .y((d) => d.y);

    g.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", linkPath as any)
      .attr("fill", "none")
      .attr("stroke", "rgba(197,160,89,0.35)")
      .attr("stroke-width", 1.5);

    // Spouse lines (horizontal, dashed)
    for (const node of nodes) {
      if (node.data.id === "__root__") continue;
      for (const spouseId of node.data.spouseIds) {
        const spouseNode = nodes.find((n) => n.data.id === spouseId);
        if (spouseNode && node.data.id < spouseId) {
          g.append("line")
            .attr("x1", node.x)
            .attr("y1", node.y)
            .attr("x2", spouseNode.x)
            .attr("y2", spouseNode.y)
            .attr("stroke", "rgba(197,160,89,0.5)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "6 4");
        }
      }
    }

    // Nodes
    const nodeGroups = g.selectAll(".node")
      .data(nodes.filter((n) => n.data.id !== "__root__"))
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (_event, d) => onSelectMember(d.data.id));

    // Card bg
    nodeGroups.append("rect")
      .attr("x", -NODE_W / 2)
      .attr("y", -NODE_H / 2)
      .attr("width", NODE_W)
      .attr("height", NODE_H)
      .attr("rx", 3)
      .attr("fill", (d) => {
        if (d.data.id === selectedMemberId) return "#8a0000";
        return d.data.isDeceased ? "#2d1b1b" : "#1a0808";
      })
      .attr("stroke", (d) => (d.data.id === selectedMemberId ? "#e5c17c" : "rgba(197,160,89,0.4)"))
      .attr("stroke-width", (d) => (d.data.id === selectedMemberId ? 2 : 1));

    // Name text
    nodeGroups.append("text")
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .attr("font-family", "Cinzel, serif")
      .attr("font-size", "11px")
      .attr("fill", (d) => (d.data.isDeceased ? "rgba(244,235,208,0.7)" : "#f4ebd0"))
      .text((d) =>
        d.data.fullName.length > 18 ? d.data.fullName.slice(0, 16) + "…" : d.data.fullName
      );

    // Years text
    nodeGroups.append("text")
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("font-family", "Noto Sans, sans-serif")
      .attr("font-size", "10px")
      .attr("fill", "rgba(197,160,89,0.7)")
      .text((d) => {
        const b = d.data.birthYear ?? "?";
        const dd = d.data.deathYear;
        if (d.data.isDeceased) return `${b} – ${dd ?? "?"}`;
        return `${b}`;
      });

    // Generation badge
    nodeGroups.append("text")
      .attr("x", NODE_W / 2 - 6)
      .attr("y", -NODE_H / 2 + 13)
      .attr("text-anchor", "end")
      .attr("font-family", "Noto Sans, sans-serif")
      .attr("font-size", "9px")
      .attr("fill", "rgba(197,160,89,0.5)")
      .text((d) => (d.data.generation ? `G${d.data.generation}` : ""));

    // Deceased cross mark
    nodeGroups.filter((d) => d.data.isDeceased)
      .append("text")
      .attr("x", -NODE_W / 2 + 8)
      .attr("y", -NODE_H / 2 + 13)
      .attr("font-size", "10px")
      .attr("fill", "rgba(197,160,89,0.6)")
      .text("✝");

  }, [members, dimensions, selectedMemberId, onSelectMember]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
