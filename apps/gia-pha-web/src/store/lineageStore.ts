import { create } from "zustand";
import type { MemberNode } from "@/types";
import type { BrainFilters } from "@/types/brain-graph";

interface LineageState {
  selectedMemberId: string | null;
  focusMemberId: string | null;
  expandedBranches: Set<string>;
  nodes: MemberNode[];
  zoom: number;
  panX: number;
  panY: number;
  // ── View mode ──────────────────────────────────────────
  viewMode: "tree" | "brain";
  // ── Brain Node View state ─────────────────────────────
  brainZoomLevel: number;
  brainCenterX: number;
  brainCenterY: number;
  showMiniMap: boolean;
  showLabels: boolean;
  brainFilters: BrainFilters;
  // ── Actions ───────────────────────────────────────────
  setSelectedMember: (id: string | null) => void;
  setFocusMember: (id: string | null) => void;
  toggleBranch: (branchName: string) => void;
  setNodes: (nodes: MemberNode[]) => void;
  setViewport: (zoom: number, panX: number, panY: number) => void;
  setViewMode: (mode: "tree" | "brain") => void;
  setBrainZoom: (level: number) => void;
  setBrainCenter: (x: number, y: number) => void;
  toggleMiniMap: () => void;
  toggleLabels: () => void;
  setBrainFilters: (filters: Partial<BrainFilters>) => void;
}

export const useLineageStore = create<LineageState>((set) => ({
  selectedMemberId: null,
  focusMemberId: null,
  expandedBranches: new Set(),
  nodes: [],
  zoom: 1,
  panX: 0,
  panY: 0,
  viewMode: "tree",
  brainZoomLevel: 1,
  brainCenterX: 0,
  brainCenterY: 0,
  showMiniMap: true,
  showLabels: true,
  brainFilters: {
    generations: [],
    roles: [],
    status: "ALL",
    gender: "ALL",
  },
  setSelectedMember: (id) => set({ selectedMemberId: id }),
  setFocusMember: (id) => set({ focusMemberId: id }),
  toggleBranch: (branchName) =>
    set((state) => {
      const next = new Set(state.expandedBranches);
      next.has(branchName) ? next.delete(branchName) : next.add(branchName);
      return { expandedBranches: next };
    }),
  setNodes: (nodes) => set({ nodes }),
  setViewport: (zoom, panX, panY) => set({ zoom, panX, panY }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setBrainZoom: (level) => set({ brainZoomLevel: level }),
  setBrainCenter: (x, y) => set({ brainCenterX: x, brainCenterY: y }),
  toggleMiniMap: () => set((s) => ({ showMiniMap: !s.showMiniMap })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  setBrainFilters: (filters) =>
    set((s) => ({ brainFilters: { ...s.brainFilters, ...filters } })),
}));
