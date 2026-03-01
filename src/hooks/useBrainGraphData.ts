"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useLineageStore } from "@/store/lineageStore";
import { buildBrainGraphData } from "@/lib/brain-graph-transform";
import type { BrainGraphData } from "@/types/brain-graph";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBrainGraphData(): {
  graphData: BrainGraphData | null;
  isLoading: boolean;
} {
  // API: GET /api/v1/members → { data: { data: [...], pagination: {...} } }
  const { data: membersRes, isLoading } = useSWR(
    "/api/v1/members?limit=200",
    fetcher,
  );

  const filters = useLineageStore((s) => s.brainFilters);

  const graphData = useMemo<BrainGraphData | null>(() => {
    const members: any[] = membersRes?.data?.data ?? [];
    if (members.length === 0) return null;

    // Derive relationships from each member's embedded parentIds / spouseIds
    // to avoid needing a separate GET /relationships endpoint.
    const seenParentChild = new Set<string>();
    const seenSpouse = new Set<string>();
    const relationships: Array<{
      parentId?: string;
      childId?: string;
      memberAId?: string;
      memberBId?: string;
      type?: string;
    }> = [];

    for (const m of members) {
      for (const parentId of m.parentIds ?? []) {
        const key = `${parentId}->${m.id}`;
        if (!seenParentChild.has(key)) {
          seenParentChild.add(key);
          relationships.push({ parentId, childId: m.id, type: "PARENT_CHILD" });
        }
      }
      for (const spouseId of m.spouseIds ?? []) {
        const key = [m.id, spouseId].sort().join("--");
        if (!seenSpouse.has(key)) {
          seenSpouse.add(key);
          relationships.push({ memberAId: m.id, memberBId: spouseId, type: "SPOUSE" });
        }
      }
    }

    return buildBrainGraphData(members, relationships, filters);
  }, [membersRes, filters]);

  return { graphData, isLoading };
}
