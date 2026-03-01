"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";

const D3LineageTree = dynamic(() => import("@/components/lineage/D3LineageTree"), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Member {
  id: string;
  fullName: string;
  birthDateSolar?: string | null;
  deathDateSolar?: string | null;
  isDeceased: boolean;
  generation?: number | null;
  avatarUrl?: string | null;
  gender?: string | null;
  lineageRole?: string | null;
  parentIds?: string[];
  childIds?: string[];
  spouseIds?: string[];
}

interface MemberNode {
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

function toNode(m: Member): MemberNode {
  return {
    id: m.id,
    fullName: m.fullName,
    birthYear: m.birthDateSolar ? new Date(m.birthDateSolar).getFullYear() : null,
    deathYear: m.deathDateSolar ? new Date(m.deathDateSolar).getFullYear() : null,
    isDeceased: m.isDeceased,
    generation: m.generation,
    avatarUrl: m.avatarUrl,
    gender: m.gender,
    lineageRole: m.lineageRole,
    parentIds: m.parentIds ?? [],
    spouseIds: m.spouseIds ?? [],
  };
}

export default function LineageClient() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"tree" | "neural">("tree");

  const handleAddChild = useCallback(
    (parentId: string) => router.push(`/lineage/add?parentId=${parentId}`),
    [router]
  );

  const { data: membersData, isLoading } = useSWR(
    "/api/v1/members?limit=200",
    fetcher
  );

  const { data: selectedData } = useSWR(
    selectedId ? `/api/v1/members/${selectedId}` : null,
    fetcher
  );

  const members: Member[] = useMemo(() => membersData?.data?.data ?? [], [membersData]);
  const nodes: MemberNode[] = useMemo(
    () =>
      members
        .filter((m) =>
          !search || m.fullName.toLowerCase().includes(search.toLowerCase())
        )
        .map(toNode),
    [members, search]
  );

  const selectedMember = selectedData?.data ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ── Toolbar ── */}
      <div className="border-b border-antique-gold/20 bg-lacquer-dark/80 backdrop-blur px-6 py-3 flex items-center gap-4 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm thành viên..."
          className="bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/30 text-sm px-4 py-2 rounded-sm focus:outline-none focus:border-antique-gold/60 w-60"
        />
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setView("tree")}
            className={`px-4 py-2 text-xs font-header tracking-widest uppercase transition-colors ${
              view === "tree"
                ? "bg-imperial-crimson text-parchment border border-antique-gold/50"
                : "text-antique-gold/60 border border-antique-gold/20 hover:border-antique-gold/50"
            }`}
          >
            Cây Phả
          </button>
          <button
            onClick={() => setView("neural")}
            className={`px-4 py-2 text-xs font-header tracking-widest uppercase transition-colors ${
              view === "neural"
                ? "bg-imperial-crimson text-parchment border border-antique-gold/50"
                : "text-antique-gold/60 border border-antique-gold/20 hover:border-antique-gold/50"
            }`}
          >
            Mạng Lưới
          </button>
          <Link
            href="/lineage/add"
            className="btn-lacquer px-4 py-2 text-xs font-header tracking-widest uppercase ml-2"
          >
            + Thêm
          </Link>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree canvas */}
        <div className="flex-1 relative bg-bg-dark">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">
                Đang tải dữ liệu…
              </p>
            </div>
          )}
          {!isLoading && nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <p className="font-header text-antique-gold/40 text-sm tracking-widest">
                Chưa có thành viên nào.
              </p>
              <Link href="/lineage/add" className="btn-lacquer px-6 py-3 text-xs font-header tracking-widest uppercase">
                Thêm Thành Viên Đầu Tiên
              </Link>
            </div>
          )}
          {!isLoading && nodes.length > 0 && (
            <D3LineageTree
              members={nodes}
              onSelectMember={setSelectedId}
              selectedMemberId={selectedId}
              onAddChild={handleAddChild}
            />
          )}
        </div>

        {/* Detail Panel */}
        {selectedMember && (
          <aside className="w-72 bg-lacquer-dark/95 border-l border-antique-gold/20 p-6 overflow-y-auto flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-header text-gold-leaf text-sm tracking-widest uppercase">Chi Tiết</h3>
              <button
                onClick={() => setSelectedId(null)}
                className="text-parchment/40 hover:text-parchment text-xs"
              >
                ✕
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 h-20 rounded-full border-2 border-antique-gold/50 bg-cover bg-center"
                style={{ backgroundImage: selectedMember.avatarUrl ? `url('${selectedMember.avatarUrl}')` : undefined }}
              >
                {!selectedMember.avatarUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-ornate text-2xl text-antique-gold/60">
                      {selectedMember.fullName?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="font-header text-parchment font-bold tracking-wide">
                  {selectedMember.fullName}
                </p>
                {selectedMember.isDeceased && (
                  <span className="text-xs text-antique-gold/60 font-header tracking-widest">✝ Đã Mất</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              {[
                { label: "Đời", value: selectedMember.generation ? `Đời ${selectedMember.generation}` : "—" },
                {
                  label: "Năm Sinh",
                  value: selectedMember.birthDateSolar
                    ? new Date(selectedMember.birthDateSolar).getFullYear()
                    : "—",
                },
                {
                  label: "Năm Mất",
                  value: selectedMember.isDeceased
                    ? (selectedMember.deathDateSolar
                        ? new Date(selectedMember.deathDateSolar).getFullYear()
                        : "—")
                    : "N/A",
                },
                { label: "Giới Tính", value: selectedMember.gender === "MALE" ? "Nam" : selectedMember.gender === "FEMALE" ? "Nữ" : "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-parchment/40 font-sans">{item.label}</span>
                  <span className="text-parchment/90 font-sans">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Parents */}
            {selectedMember.parents?.length > 0 && (
              <div>
                <p className="font-header text-antique-gold/70 text-xs tracking-widest uppercase mb-2">Cha Mẹ</p>
                {selectedMember.parents.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="block w-full text-left text-parchment/70 hover:text-parchment text-xs font-sans py-1 hover:text-gold-leaf transition-colors"
                  >
                    → {p.fullName}
                  </button>
                ))}
              </div>
            )}

            {/* Children */}
            {selectedMember.children?.length > 0 && (
              <div>
                <p className="font-header text-antique-gold/70 text-xs tracking-widest uppercase mb-2">Con Cái</p>
                {selectedMember.children.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="block w-full text-left text-parchment/70 hover:text-parchment text-xs font-sans py-1 hover:text-gold-leaf transition-colors"
                  >
                    → {c.fullName}
                  </button>
                ))}
              </div>
            )}

            <Link
              href={`/lineage/${selectedMember.id}`}
              className="btn-gold-shimmer text-center text-xs font-header tracking-widest uppercase py-2 mt-auto"
            >
              Xem Hồ Sơ Đầy Đủ
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
