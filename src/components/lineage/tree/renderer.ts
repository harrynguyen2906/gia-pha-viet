import * as d3 from "d3";
import type { TreeNode, TreeLink, RenderContext } from "./types";
import { NODE_W, NODE_H, MALE_ICON, FEMALE_ICON, OTHER_ICON, ROLE_COLORS } from "./constants";
import { countAllDescendants } from "./treeUtils";

type SvgSel = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type GSel = d3.Selection<SVGGElement, unknown, null, undefined>;

const DEFAULT_ANIMATION_MS = 280;

// ── Elbow / org-chart connector path ─────────────────────────────────────────
export function elbowPath(d: TreeLink): string {
  const sx = d.source.x;
  const sy = d.source.y + NODE_H / 2;
  const tx = d.target.x;
  const ty = d.target.y - NODE_H / 2;
  const midY = (sy + ty) / 2;
  return `M ${sx},${sy} V ${midY} H ${tx} V ${ty}`;
}

function elbowPathByPoints(
  sx: number,
  syCenter: number,
  tx: number,
  tyCenter: number
): string {
  const sy = syCenter + NODE_H / 2;
  const ty = tyCenter - NODE_H / 2;
  const midY = (sy + ty) / 2;
  return `M ${sx},${sy} V ${midY} H ${tx} V ${ty}`;
}

// ── SVG defs (filters + avatar clip-paths) ────────────────────────────────────
export function setupDefs(svg: SvgSel, nodes: TreeNode[]): void {
  const defs = svg.append("defs");

  defs
    .append("filter")
    .attr("id", "grayscale-filter")
    .append("feColorMatrix")
    .attr("type", "saturate")
    .attr("values", "0.15");

  defs
    .append("filter")
    .attr("id", "node-glow")
    .html(
      `<feGaussianBlur stdDeviation="3" result="blur"/>
       <feComposite in="SourceGraphic" in2="blur" operator="over"/>`
    );

  nodes
    .filter((n) => n.data.id !== "__root__" && !!n.data.avatarUrl)
    .forEach((n) => {
      defs
        .append("clipPath")
        .attr("id", `avatar-clip-${n.data.id.replace(/[^a-zA-Z0-9]/g, "_")}`)
        .append("circle")
        .attr("r", 18);
    });
}

// ── Elbow connector links ─────────────────────────────────────────────────────
export function drawLinks(
  g: GSel,
  links: TreeLink[],
  previousPositions: Map<string, { x: number; y: number }>,
  animationMs = DEFAULT_ANIMATION_MS
): void {
  g.selectAll(".link")
    .data(links)
    .join("path")
    .attr("class", "link")
    .attr("d", (d) => {
      const sourcePrev = previousPositions.get(d.source.data.id) ?? {
        x: d.source.x,
        y: d.source.y,
      };
      const targetPrev = previousPositions.get(d.target.data.id) ?? sourcePrev;
      return elbowPathByPoints(sourcePrev.x, sourcePrev.y, targetPrev.x, targetPrev.y);
    })
    .attr("fill", "none")
    .attr("stroke", "rgba(197,160,89,0.35)")
    .attr("stroke-width", 1.5)
    .transition()
    .duration(animationMs)
    .ease(d3.easeCubicOut)
    .attr("d", elbowPath as any);
}

// ── Dashed spouse lines ───────────────────────────────────────────────────────
export function drawSpouseLines(
  g: GSel,
  nodes: TreeNode[],
  previousPositions: Map<string, { x: number; y: number }>,
  animationMs = DEFAULT_ANIMATION_MS
): void {
  const drawn = new Set<string>();
  for (const node of nodes) {
    if (node.data.id === "__root__") continue;
    for (const spouseId of node.data.spouseIds) {
      const spouse = nodes.find((n) => n.data.id === spouseId);
      const key = [node.data.id, spouseId].sort().join("|");
      if (spouse && !drawn.has(key)) {
        drawn.add(key);
        const fromNode = previousPositions.get(node.data.id) ?? { x: node.x, y: node.y };
        const fromSpouse = previousPositions.get(spouseId) ?? fromNode;
        g.append("line")
          .attr("x1", fromNode.x)
          .attr("y1", fromNode.y)
          .attr("x2", fromSpouse.x)
          .attr("y2", fromSpouse.y)
          .attr("stroke", "rgba(197,160,89,0.45)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "6 4")
          .transition()
          .duration(animationMs)
          .ease(d3.easeCubicOut)
          .attr("x1", node.x)
          .attr("y1", node.y)
          .attr("x2", spouse.x)
          .attr("y2", spouse.y);
      }
    }
  }
}

// ── Node groups with all visual layers ───────────────────────────────────────
export function drawNodes(g: GSel, nodes: TreeNode[], ctx: RenderContext): void {
  const {
    selectedMemberId,
    collapsedNodes,
    childrenMap,
    onSelectMember,
    onAddChild,
    setCollapsedNodes,
    previousPositions,
    animationMs,
  } = ctx;
  const visible = nodes.filter((n) => n.data.id !== "__root__");

  const nodeGroups = g
    .selectAll<SVGGElement, TreeNode>(".node")
    .data(visible)
    .join("g")
    .attr("class", "node")
    .attr("transform", (d) => {
      const previous = previousPositions.get(d.data.id) ??
        (d.parent ? previousPositions.get(d.parent.data.id) : undefined) ??
        { x: d.x, y: d.y };
      return `translate(${previous.x},${previous.y})`;
    })
    .transition()
    .duration(animationMs)
    .ease(d3.easeCubicOut)
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .selection()
    .style("cursor", "pointer")
    .on("click", (_e, d) => onSelectMember(d.data.id));

  // Card background
  nodeGroups
    .append("rect")
    .attr("class", "card-rect")
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

  // Avatar circle background
  nodeGroups
    .append("circle")
    .attr("cx", -NODE_W / 2 + 28)
    .attr("cy", 0)
    .attr("r", 20)
    .attr("fill", "rgba(197,160,89,0.1)")
    .attr("stroke", "rgba(197,160,89,0.3)")
    .attr("stroke-width", 1)
    .attr("filter", (d) => (d.data.isDeceased ? "url(#grayscale-filter)" : null));

  // Avatar image (when available)
  nodeGroups
    .filter((d) => !!d.data.avatarUrl)
    .append("image")
    .attr("href", (d) => d.data.avatarUrl!)
    .attr("x", -NODE_W / 2 + 10)
    .attr("y", -18)
    .attr("width", 36)
    .attr("height", 36)
    .attr("clip-path", (d) => `url(#avatar-clip-${d.data.id.replace(/[^a-zA-Z0-9]/g, "_")})`)
    .attr("filter", (d) => (d.data.isDeceased ? "url(#grayscale-filter)" : null));

  // Gender icon (when no avatar)
  nodeGroups
    .filter((d) => !d.data.avatarUrl)
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

  // Role badge (top-right dot)
  nodeGroups
    .filter((d) => !!(d.data.lineageRole && ROLE_COLORS[d.data.lineageRole]))
    .append("circle")
    .attr("cx", NODE_W / 2 - 12)
    .attr("cy", -NODE_H / 2 + 12)
    .attr("r", 5)
    .attr("fill", (d) => ROLE_COLORS[d.data.lineageRole!] ?? "transparent")
    .attr("stroke", "rgba(26,8,8,0.8)")
    .attr("stroke-width", 1);

  // Full name
  nodeGroups
    .append("text")
    .attr("x", -NODE_W / 2 + 58)
    .attr("y", -10)
    .attr("font-family", "Cinzel, serif")
    .attr("font-size", "11px")
    .attr("fill", (d) => (d.data.isDeceased ? "rgba(244,235,208,0.6)" : "#f4ebd0"))
    .text((d) => (d.data.fullName.length > 16 ? d.data.fullName.slice(0, 14) + "…" : d.data.fullName));

  // Birth / death years
  nodeGroups
    .append("text")
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

  // Generation label
  nodeGroups
    .append("text")
    .attr("x", -NODE_W / 2 + 58)
    .attr("y", 24)
    .attr("font-family", "Noto Sans, sans-serif")
    .attr("font-size", "9px")
    .attr("fill", "rgba(197,160,89,0.4)")
    .text((d) => (d.data.generation ? `Đời ${d.data.generation}` : ""));

  // Deceased cross mark
  nodeGroups
    .filter((d) => d.data.isDeceased)
    .append("text")
    .attr("x", NODE_W / 2 - 28)
    .attr("y", -NODE_H / 2 + 14)
    .attr("font-size", "10px")
    .attr("fill", "rgba(197,160,89,0.5)")
    .text("✝");

  // Hover highlight
  nodeGroups
    .on("mouseenter", function (_e, d) {
      d3.select(this)
        .select(".card-rect")
        .attr("stroke", d.data.id === selectedMemberId ? "#e5c17c" : "rgba(197,160,89,0.7)");
      if (onAddChild) {
        d3.select(this)
          .select(".add-child-btn")
          .transition()
          .duration(150)
          .style("opacity", 1)
          .style("pointer-events", "all");
      }
    })
    .on("mouseleave", function (_e, d) {
      d3.select(this)
        .select(".card-rect")
        .attr("stroke", d.data.id === selectedMemberId ? "#e5c17c" : "rgba(197,160,89,0.35)");
      if (onAddChild) {
        d3.select(this)
          .select(".add-child-btn")
          .transition()
          .duration(150)
          .style("opacity", 0)
          .style("pointer-events", "none");
      }
    });

  // ── Collapse/expand button ─────────────────────────────────────────────────
  const collapsible = nodeGroups.filter(
    (d) => (childrenMap.get(d.data.id)?.length ?? 0) > 0
  );

  collapsible
    .append("circle")
    .attr("class", "collapse-btn")
    .attr("cy", NODE_H / 2 + 10)
    .attr("cx", 0)
    .attr("r", 9)
    .attr("fill", "#1a0808")
    .attr("stroke", "rgba(197,160,89,0.45)")
    .attr("stroke-width", 1)
    .style("cursor", "pointer");

  collapsible
    .append("text")
    .attr("y", NODE_H / 2 + 14)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("fill", "rgba(197,160,89,0.8)")
    .attr("pointer-events", "none")
    .text((d) => (collapsedNodes.has(d.data.id) ? "▸" : "▾"));

  // Collapsed descendant count badge
  visible.forEach((d) => {
    if (collapsedNodes.has(d.data.id)) {
      const count = countAllDescendants(d.data.id, childrenMap);
      g.selectAll<SVGGElement, TreeNode>(".node")
        .filter((n) => n.data.id === d.data.id)
        .append("text")
        .attr("x", 14)
        .attr("y", NODE_H / 2 + 14)
        .attr("font-size", "8px")
        .attr("fill", "rgba(197,160,89,0.6)")
        .attr("pointer-events", "none")
        .text(`+${count}`);
    }
  });

  collapsible.select(".collapse-btn").on("click", (event, d) => {
    event.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      next.has(d.data.id) ? next.delete(d.data.id) : next.add(d.data.id);
      return next;
    });
  });

  // ── Add-child hover button ─────────────────────────────────────────────────
  if (onAddChild) {
    const addBtns = nodeGroups
      .append("g")
      .attr("class", "add-child-btn")
      .attr("transform", `translate(${NODE_W / 2 - 16}, ${NODE_H / 2 - 16})`)
      .style("opacity", 0)
      .style("pointer-events", "none");

    addBtns
      .append("circle")
      .attr("r", 11)
      .attr("fill", "#8a0000")
      .attr("stroke", "rgba(197,160,89,0.5)")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");

    addBtns
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.38em")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("fill", "#f4ebd0")
      .attr("pointer-events", "none")
      .text("+");

    addBtns.on("click", (event, d) => {
      event.stopPropagation();
      onAddChild(d.data.id);
    });
  }
}
