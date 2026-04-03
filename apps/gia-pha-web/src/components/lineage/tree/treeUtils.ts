import * as d3 from "d3";
import type { MemberNode, TreeNode, TreeLink, TreeBounds } from "./types";
import { NODE_W, NODE_H } from "./constants";

export interface HierarchyResult {
  childrenMap: Map<string, string[]>;
  nodes: TreeNode[];
  links: TreeLink[];
  bounds: TreeBounds;
}

export function buildHierarchy(
  members: MemberNode[],
  collapsedNodes: Set<string>
): HierarchyResult {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const childrenMap = new Map<string, string[]>();

  for (const m of members) {
    for (const pid of m.parentIds) {
      if (!childrenMap.has(pid)) childrenMap.set(pid, []);
      childrenMap.get(pid)!.push(m.id);
    }
  }

  // Fix hierarchy bug: use minimum generation to detect true roots
  const allGenerations = members
    .map((m) => m.generation)
    .filter((g): g is number => g != null);
  const minGeneration = allGenerations.length > 0 ? Math.min(...allGenerations) : 1;

  const rootCandidates = members.filter((m) => {
    const parentsInDataset = m.parentIds.filter((pid) => memberMap.has(pid));
    return parentsInDataset.length === 0;
  });

  // Keep the canonical top ancestor roots (minimum generation), but also include
  // disconnected/orphan members so newly created unlinked members are still visible.
  const topRoots = rootCandidates.filter(
    (m) => (m.generation ?? minGeneration) <= minGeneration
  );

  const fallbackRoots = members.filter((m) => (m.generation ?? 1) === minGeneration);

  const mainRoots = topRoots.length > 0 ? topRoots : fallbackRoots;
  const mainRootIds = new Set(mainRoots.map((m) => m.id));
  const orphanRoots = rootCandidates.filter((m) => !mainRootIds.has(m.id));
  const effectiveRoots = [...mainRoots, ...orphanRoots];

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

  const visited = new Set<string>();
  function getChildren(node: MemberNode): MemberNode[] | undefined {
    if (visited.has(node.id)) return undefined;
    visited.add(node.id);
    if (collapsedNodes.has(node.id)) return undefined;
    const childIds = childrenMap.get(node.id) ?? [];
    const children = childIds.map((cid) => memberById.get(cid)).filter(Boolean) as MemberNode[];
    return children.length > 0 ? children : undefined;
  }

  const hierarchyRoot = d3.hierarchy(memberById.get(startId)!, getChildren);

  const treeLayout = d3
    .tree<MemberNode>()
    .nodeSize([NODE_W + 24, NODE_H + 70])
    .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8));

  const treeData = treeLayout(hierarchyRoot);
  const nodes = treeData.descendants() as TreeNode[];
  const links = treeData.links() as TreeLink[];

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - NODE_W / 2 - 60;
  const maxX = Math.max(...xs) + NODE_W / 2 + 60;
  const minY = Math.min(...ys) - NODE_H / 2 - 60;
  const maxY = Math.max(...ys) + NODE_H / 2 + 80;

  return {
    childrenMap,
    nodes,
    links,
    bounds: { minX, minY, totalW: maxX - minX, totalH: maxY - minY },
  };
}

export function countAllDescendants(
  nodeId: string,
  childrenMap: Map<string, string[]>
): number {
  const childIds = childrenMap.get(nodeId) ?? [];
  return childIds.reduce(
    (sum, cid) => sum + 1 + countAllDescendants(cid, childrenMap),
    0
  );
}
