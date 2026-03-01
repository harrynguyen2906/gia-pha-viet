import type {
  BrainGraphData,
  BrainNode,
  BrainLink,
  BrainFilters,
} from "@/types/brain-graph";
import { NODE_COLORS } from "@/types/brain-graph";

// ── Helpers ────────────────────────────────────────────────

export function extractShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 2 ? parts.slice(-2).join(" ") : fullName;
}

export function getNodeRadius(node: BrainNode, isRoot: boolean): number {
  if (isRoot) return 28;
  if (node.connectionCount === 0) return 8;
  const base = 12;
  const bonus = Math.min(node.connectionCount * 1.5, 12);
  return base + bonus;
}

export function getNodeColor(
  node: BrainNode,
  selectedId?: string | null,
): { fill: string; border: string } {
  if (node.id === selectedId) return NODE_COLORS.SELECTED;
  if (node.isDeceased) return NODE_COLORS.DECEASED;
  if (node.lineageRole && NODE_COLORS[node.lineageRole]) {
    return NODE_COLORS[node.lineageRole];
  }
  return node.gender === "FEMALE" ? NODE_COLORS.FEMALE : NODE_COLORS.MALE;
}

// ── Main transform ─────────────────────────────────────────

interface RawMember {
  id: string;
  fullName: string;
  generation?: number | null;
  gender?: string | null;
  lineageRole?: string | null;
  isDeceased: boolean;
  avatarUrl?: string | null;
  birthDateSolar?: string | null;
  deathDateSolar?: string | null;
}

interface RawRelationship {
  id?: string;
  parentId?: string | null;
  childId?: string | null;
  memberAId?: string | null;
  memberBId?: string | null;
  type?: string;
}

export function buildBrainGraphData(
  members: RawMember[],
  relationships: RawRelationship[],
  filters?: Partial<BrainFilters>,
): BrainGraphData {
  // 1. Apply filters on members
  let filtered = members;

  if (filters?.generations && filters.generations.length > 0) {
    filtered = filtered.filter(
      (m) =>
        m.generation != null && filters.generations!.includes(m.generation),
    );
  }
  if (filters?.roles && filters.roles.length > 0) {
    filtered = filtered.filter(
      (m) => m.lineageRole && filters.roles!.includes(m.lineageRole),
    );
  }
  if (filters?.status && filters.status !== "ALL") {
    filtered = filtered.filter((m) =>
      filters.status === "DECEASED" ? m.isDeceased : !m.isDeceased,
    );
  }
  if (filters?.gender && filters.gender !== "ALL") {
    filtered = filtered.filter((m) => m.gender === filters.gender);
  }

  const nodeIdSet = new Set(filtered.map((m) => m.id));

  // 2. Build BrainNode array (connectionCount computed later)
  const nodeMap = new Map<string, BrainNode>();
  for (const m of filtered) {
    const node: BrainNode = {
      id: m.id,
      fullName: m.fullName,
      shortName: extractShortName(m.fullName),
      generation: m.generation ?? 1,
      gender: (m.gender as BrainNode["gender"]) ?? "MALE",
      lineageRole: m.lineageRole,
      isDeceased: m.isDeceased,
      avatarUrl: m.avatarUrl,
      birthYear: m.birthDateSolar
        ? new Date(m.birthDateSolar).getFullYear()
        : null,
      deathYear: m.deathDateSolar
        ? new Date(m.deathDateSolar).getFullYear()
        : null,
      connectionCount: 0,
    };
    nodeMap.set(m.id, node);
  }

  // 3. Build links — filter to only those where both ends exist
  const links: BrainLink[] = [];
  for (const rel of relationships) {
    let source: string | undefined;
    let target: string | undefined;
    let type: BrainLink["type"] = "PARENT_CHILD";

    if (rel.type === "SPOUSE" || rel.type === "MARRIAGE") {
      source = rel.memberAId ?? rel.parentId ?? undefined;
      target = rel.memberBId ?? rel.childId ?? undefined;
      type = "SPOUSE";
    } else {
      // PARENT_CHILD or similar
      source = rel.parentId ?? rel.memberAId ?? undefined;
      target = rel.childId ?? rel.memberBId ?? undefined;
    }

    if (!source || !target) continue;
    if (!nodeIdSet.has(source) || !nodeIdSet.has(target)) continue;
    if (source === target) continue;

    links.push({ source, target, type });

    // Increment connectionCount
    const srcNode = nodeMap.get(source);
    const tgtNode = nodeMap.get(target);
    if (srcNode) srcNode.connectionCount++;
    if (tgtNode) tgtNode.connectionCount++;
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}
