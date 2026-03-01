import { create } from "zustand";
import type { MemberNode } from "@/types";

interface LineageState {
  selectedMemberId: string | null;
  focusMemberId: string | null;
  expandedBranches: Set<string>;
  nodes: MemberNode[];
  zoom: number;
  panX: number;
  panY: number;
  setSelectedMember: (id: string | null) => void;
  setFocusMember: (id: string | null) => void;
  toggleBranch: (branchName: string) => void;
  setNodes: (nodes: MemberNode[]) => void;
  setViewport: (zoom: number, panX: number, panY: number) => void;
}

export const useLineageStore = create<LineageState>((set) => ({
  selectedMemberId: null,
  focusMemberId: null,
  expandedBranches: new Set(),
  nodes: [],
  zoom: 1,
  panX: 0,
  panY: 0,
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
}));
