"use client";

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLineageStore } from "@/store/lineageStore";
import { useBrainGraphData } from "@/hooks/useBrainGraphData";
import BrainInspector from "@/components/lineage/BrainInspector";
import BrainMiniMap from "@/components/lineage/BrainMiniMap";

// SSR-safe canvas
const BrainNodeCanvas = dynamic(
  () => import("@/components/lineage/BrainNodeCanvas"),
  { ssr: false, loading: () => <BrainLoadingOverlay /> },
);

function BrainLoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-dark">
      <p className="font-header text-antique-gold/50 text-sm tracking-widest uppercase animate-pulse">
        Đang tải đồ thị…
      </p>
    </div>
  );
}

interface BrainViewProps {
  canEdit?: boolean;
  onAddMember?: () => void;
}

export default function BrainView({ canEdit = false, onAddMember }: BrainViewProps) {
  const { graphData, isLoading } = useBrainGraphData();
  const graphRef = useRef<any>(null);

  const selectedMemberId = useLineageStore((s) => s.selectedMemberId);
  const setSelectedMember = useLineageStore((s) => s.setSelectedMember);
  const showMiniMap = useLineageStore((s) => s.showMiniMap);
  const toggleMiniMap = useLineageStore((s) => s.toggleMiniMap);
  const brainFilters = useLineageStore((s) => s.brainFilters);
  const setBrainFilters = useLineageStore((s) => s.setBrainFilters);

  // Viewport state for mini-map
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1,
    width: 800,
    height: 600,
  });

  const handleSelectNode = useCallback(
    (id: string | null) => setSelectedMember(id),
    [setSelectedMember],
  );

  const handleNavigate = useCallback((gx: number, gy: number) => {
    (graphRef as any).current?.centerAt(gx, gy, 300);
  }, []);

  // Collect all generations present in graph for filter UI
  const generationList = graphData
    ? Array.from(new Set(graphData.nodes.map((n) => n.generation))).sort(
        (a, b) => a - b,
      )
    : [];

  if (isLoading) {
    return (
      <div className="flex-1 relative bg-bg-dark">
        <BrainLoadingOverlay />
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-dark gap-4">
        <p className="font-header text-antique-gold/40 text-sm tracking-widest uppercase">
          Chưa có thành viên nào.
        </p>
        {canEdit && onAddMember && (
          <button
            type="button"
            onClick={onAddMember}
            className="btn-lacquer px-6 py-3 text-xs font-header tracking-widest uppercase"
          >
            + Thêm Thành Viên
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Left filter sidebar */}
      <aside className="w-56 shrink-0 bg-lacquer-dark/90 border-r border-antique-gold/15 flex flex-col overflow-y-auto">
        <div className="px-4 py-4 space-y-5">
          {/* Stats */}
          <div>
            <p className="text-[10px] font-header tracking-widest uppercase text-antique-gold/40 mb-2">
              Thống Kê
            </p>
            <div className="space-y-1 text-xs font-sans text-parchment/60">
              <div className="flex justify-between">
                <span>Thành viên</span>
                <span className="text-antique-gold">{graphData.nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Thế hệ</span>
                <span className="text-antique-gold">{generationList.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Liên kết</span>
                <span className="text-antique-gold">{graphData.links.length}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-antique-gold/10" />

          {/* Filter: Status */}
          <div>
            <p className="text-[10px] font-header tracking-widest uppercase text-antique-gold/40 mb-2">
              Trạng Thái
            </p>
            <div className="space-y-1.5">
              {(["ALL", "LIVING", "DECEASED"] as const).map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="brain-status"
                    checked={brainFilters.status === s}
                    onChange={() => setBrainFilters({ status: s })}
                    className="accent-imperial-crimson"
                  />
                  <span className="text-xs font-sans text-parchment/70">
                    {s === "ALL" ? "Tất cả" : s === "LIVING" ? "Còn sống" : "Đã mất"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-antique-gold/10" />

          {/* Filter: Gender */}
          <div>
            <p className="text-[10px] font-header tracking-widest uppercase text-antique-gold/40 mb-2">
              Giới Tính
            </p>
            <div className="space-y-1.5">
              {(["ALL", "MALE", "FEMALE"] as const).map((g) => (
                <label
                  key={g}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="brain-gender"
                    checked={brainFilters.gender === g}
                    onChange={() => setBrainFilters({ gender: g })}
                    className="accent-imperial-crimson"
                  />
                  <span className="text-xs font-sans text-parchment/70">
                    {g === "ALL" ? "Tất cả" : g === "MALE" ? "Nam" : "Nữ"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter: Generation */}
          {generationList.length > 0 && (
            <>
              <div className="border-t border-antique-gold/10" />
              <div>
                <p className="text-[10px] font-header tracking-widest uppercase text-antique-gold/40 mb-2">
                  Thế Hệ
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {generationList.map((g) => (
                    <label
                      key={g}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          brainFilters.generations.length === 0 ||
                          brainFilters.generations.includes(g)
                        }
                        onChange={(e) => {
                          const current =
                            brainFilters.generations.length === 0
                              ? generationList
                              : brainFilters.generations;
                          const updated = e.target.checked
                            ? Array.from(new Set([...current, g]))
                            : current.filter((x) => x !== g);
                          // If all selected, store empty (= all)
                          setBrainFilters({
                            generations:
                              updated.length === generationList.length
                                ? []
                                : updated,
                          });
                        }}
                        className="accent-imperial-crimson"
                      />
                      <span className="text-xs font-sans text-parchment/70">
                        Đời thứ {g}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Clear filters */}
          {(brainFilters.status !== "ALL" ||
            brainFilters.gender !== "ALL" ||
            brainFilters.generations.length > 0 ||
            brainFilters.roles.length > 0) && (
            <button
              onClick={() =>
                setBrainFilters({
                  status: "ALL",
                  gender: "ALL",
                  generations: [],
                  roles: [],
                })
              }
              className="w-full py-2 text-xs font-header tracking-widest uppercase border border-antique-gold/20 text-antique-gold/60 hover:text-parchment hover:border-antique-gold/50 transition-colors"
            >
              Xóa Bộ Lọc
            </button>
          )}
        </div>
      </aside>

      {/* Canvas area */}
      <div className="flex-1 relative bg-bg-dark overflow-hidden">
        <BrainNodeCanvas
          graphData={graphData}
          selectedNodeId={selectedMemberId}
          onSelectNode={handleSelectNode}
        />

        {/* Mini-map */}
        <BrainMiniMap
          graphData={graphData}
          viewport={viewport}
          onNavigate={handleNavigate}
          visible={showMiniMap}
          onToggle={toggleMiniMap}
        />
      </div>

      {/* Inspector panel */}
      <div className="relative">
        <BrainInspector
          memberId={selectedMemberId}
          onSelectNode={(id) => {
            handleSelectNode(id);
          }}
          onClose={() => handleSelectNode(null)}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
