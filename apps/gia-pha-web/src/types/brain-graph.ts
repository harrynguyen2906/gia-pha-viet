// ── Brain Node Graph Types ────────────────────────────────

export interface BrainNode {
  id: string;
  fullName: string;
  shortName: string;
  generation: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  lineageRole?: string | null;
  isDeceased: boolean;
  avatarUrl?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  connectionCount: number;
  // d3-force runtime fields (mutated by simulation)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface BrainLink {
  source: string | BrainNode;
  target: string | BrainNode;
  type: "PARENT_CHILD" | "SPOUSE";
}

export interface BrainGraphData {
  nodes: BrainNode[];
  links: BrainLink[];
}

export interface BrainFilters {
  generations: number[]; // empty = all
  roles: string[];        // empty = all
  status: "ALL" | "LIVING" | "DECEASED";
  gender: "ALL" | "MALE" | "FEMALE";
}

// Node color mapping by role/status/gender
export const NODE_COLORS: Record<string, { fill: string; border: string }> = {
  HEAD_OF_HOUSE: { fill: "#e74c3c", border: "#c0392b" },
  ELDER:         { fill: "#f39c12", border: "#d68910" },
  HEIR:          { fill: "#2ecc71", border: "#27ae60" },
  MALE:          { fill: "#3498db", border: "#2980b9" },
  FEMALE:        { fill: "#9b59b6", border: "#8e44ad" },
  DECEASED:      { fill: "#95a5a6", border: "#7f8c8d" },
  SELECTED:      { fill: "#e5c17c", border: "#c5a059" },
};
