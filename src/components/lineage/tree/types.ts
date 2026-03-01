import type * as d3 from "d3";

export interface MemberNode {
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

export type TreeNode = d3.HierarchyPointNode<MemberNode>;
export type TreeLink = d3.HierarchyPointLink<MemberNode>;

export interface Props {
  members: MemberNode[];
  onSelectMember: (id: string) => void;
  selectedMemberId: string | null;
  onAddChild?: (parent: {
    id: string;
    fullName: string;
    generation?: number | null;
    isDeceased: boolean;
  }) => void;
}

export interface TreeBounds {
  minX: number;
  minY: number;
  totalW: number;
  totalH: number;
}

export interface RenderContext {
  getSelectedMemberId: () => string | null;
  collapsedNodes: Set<string>;
  childrenMap: Map<string, string[]>;
  onSelectMember: (id: string) => void;
  onAddChild?: (parent: {
    id: string;
    fullName: string;
    generation?: number | null;
    isDeceased: boolean;
  }) => void;
  setCollapsedNodes: (fn: (prev: Set<string>) => Set<string>) => void;
  previousPositions: Map<string, { x: number; y: number }>;
  animationMs: number;
}
