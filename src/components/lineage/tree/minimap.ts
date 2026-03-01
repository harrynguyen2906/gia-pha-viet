import * as d3 from "d3";
import type { TreeNode, TreeLink, TreeBounds } from "./types";
import { NODE_W, NODE_H, MINI_W, MINI_H } from "./constants";

/**
 * Renders (or re-renders) the mini-map overview overlay.
 * Called on initial draw and on every zoom/pan event.
 */
export function renderMiniMap(
  miniSvgEl: SVGSVGElement,
  nodes: TreeNode[],
  links: TreeLink[],
  bounds: TreeBounds,
  transform: d3.ZoomTransform,
  dimensions: { w: number; h: number },
  mainSvgEl: SVGSVGElement,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
  selectedMemberId: string | null
): void {
  const { minX: bX, minY: bY, totalW: bW, totalH: bH } = bounds;
  const miniSvg = d3.select(miniSvgEl);
  miniSvg.selectAll("*").remove();

  const s = Math.min((MINI_W / bW) * 0.9, (MINI_H / bH) * 0.9);
  const offsetX = (MINI_W - bW * s) / 2 - bX * s;
  const offsetY = (MINI_H - bH * s) / 2 - bY * s;

  const mg = miniSvg
    .append("g")
    .attr("transform", `translate(${offsetX},${offsetY}) scale(${s})`);

  // Simplified links
  mg.selectAll("line.ml")
    .data(links)
    .join("line")
    .attr("class", "ml")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y)
    .attr("stroke", "rgba(197,160,89,0.2)")
    .attr("stroke-width", 0.5 / s);

  // Simplified node rects
  mg.selectAll("rect.mn")
    .data(nodes.filter((n) => n.data.id !== "__root__"))
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

  // Viewport rectangle
  const vx = (-transform.x) / transform.k + bX;
  const vy = (-transform.y) / transform.k + bY;
  const vw = dimensions.w / transform.k;
  const vh = dimensions.h / transform.k;

  mg.append("rect")
    .attr("x", vx)
    .attr("y", vy)
    .attr("width", vw)
    .attr("height", vh)
    .attr("fill", "rgba(138,0,0,0.12)")
    .attr("stroke", "#8a0000")
    .attr("stroke-width", 2 / s);

  // Click to pan main view
  miniSvg.style("cursor", "crosshair").on("click", function (event) {
    const [px, py] = d3.pointer(event);
    const worldX = (px - offsetX) / s;
    const worldY = (py - offsetY) / s;
    const k = transform.k;
    const newT = d3.zoomIdentity
      .translate(dimensions.w / 2 - worldX * k, dimensions.h / 2 - worldY * k)
      .scale(k);
    d3.select(mainSvgEl)
      .transition()
      .duration(300)
      .call((zoom as any).transform, newT);
  });
}
