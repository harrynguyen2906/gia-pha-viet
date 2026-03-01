"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";
import AddMemberForm from "@/components/lineage/AddMemberForm";

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

interface ParentSeed {
  id: string;
  fullName: string;
  generation?: number | null;
  isDeceased: boolean;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Use a ref for the pending parent seed so it's synchronously available
  // when the modal renders — avoids any React batching race condition.
  const pendingParentRef = useRef<ParentSeed | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"tree" | "neural">("tree");
  const { isOpen, open, close } = useModal();
  const {
    isOpen: isRelinkOpen,
    open: openRelink,
    close: closeRelink,
  } = useModal();
  const [relinkParentId, setRelinkParentId] = useState("");
  const [relinkSubmitting, setRelinkSubmitting] = useState(false);
  const [relinkError, setRelinkError] = useState<string | null>(null);

  const handleAddChild = useCallback(
    (parent: ParentSeed) => {
      pendingParentRef.current = parent;
      setModalKey((k) => k + 1);
      open();
    },
    [open]
  );

  const { data: membersData, isLoading, mutate: mutateMembers } = useSWR(
    "/api/v1/members?limit=200",
    fetcher
  );

  const { data: selectedData, mutate: mutateSelectedMember } = useSWR(
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

  const relinkParentOptions = useMemo(
    () => members.filter((m) => m.id !== selectedMember?.id),
    [members, selectedMember?.id]
  );

  useEffect(() => {
    if (!isRelinkOpen) return;
    setRelinkParentId("");
    setRelinkError(null);
  }, [selectedMember?.id, isRelinkOpen]);

  const openAddMemberModal = () => {
    pendingParentRef.current = null;
    setModalKey((k) => k + 1);
    open();
  };

  const handleCreateMemberSuccess = async () => {
    close();
    await mutateMembers();
  };

  const handleRelinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember?.id || !relinkParentId) return;

    setRelinkSubmitting(true);
    setRelinkError(null);

    try {
      const res = await fetch("/api/v1/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: relinkParentId,
          childId: selectedMember.id,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Khong the lien ket cha/me");

      closeRelink();
      await Promise.all([mutateMembers(), mutateSelectedMember()]);
    } catch (error: any) {
      setRelinkError(error?.message ?? "Da xay ra loi");
    } finally {
      setRelinkSubmitting(false);
    }
  };

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
          <button
            onClick={openAddMemberModal}
            className="btn-lacquer px-4 py-2 text-xs font-header tracking-widest uppercase ml-2"
            type="button"
          >
            + Thêm
          </button>
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
              <button
                type="button"
                onClick={openAddMemberModal}
                className="btn-lacquer px-6 py-3 text-xs font-header tracking-widest uppercase"
              >
                Thêm Thành Viên Đầu Tiên
              </button>
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

            {/* Relink action for existing/orphan members */}
            <button
              type="button"
              onClick={openRelink}
              className="w-full py-2 border border-antique-gold/30 text-antique-gold/80 hover:text-parchment hover:border-antique-gold/60 text-xs font-header tracking-widest uppercase transition-colors"
            >
              {selectedMember.parents?.length > 0 ? "Them Cha/Me" : "Gan Cha/Me"}
            </button>

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

      <Modal
        isOpen={isOpen}
        onClose={close}
        size="lg"
        title="Thêm Thành Viên"
      >
        <AddMemberForm
          key={modalKey}
          mode="modal"
          defaultParentId={pendingParentRef.current?.id ?? ""}
          defaultParentOption={pendingParentRef.current}
          onSuccess={handleCreateMemberSuccess}
          onCancel={close}
        />
      </Modal>

      <Modal
        isOpen={isRelinkOpen}
        onClose={closeRelink}
        size="md"
        title="Gan Cha/Me Cho Thanh Vien"
      >
        <form onSubmit={handleRelinkSubmit} className="px-5 py-5 space-y-4">
          {relinkError && (
            <div className="bg-red-950/40 border border-imperial-crimson/50 text-parchment/80 text-sm px-3 py-2">
              {relinkError}
            </div>
          )}

          <div>
            <p className="text-xs font-header tracking-widest uppercase text-antique-gold/60 mb-1.5">
              Thanh Vien
            </p>
            <p className="text-sm text-parchment/90">{selectedMember?.fullName ?? "-"}</p>
          </div>

          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/60 block mb-1.5">
              Chon Cha/Me
            </label>
            <select
              required
              value={relinkParentId}
              onChange={(e) => setRelinkParentId(e.target.value)}
              className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-3 py-2.5 focus:outline-none focus:border-antique-gold/60"
            >
              <option value="">- Chon thanh vien -</option>
              {relinkParentOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                  {m.generation ? ` (Doi ${m.generation})` : ""}
                  {m.isDeceased ? " +" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={closeRelink}
              className="py-2.5 border border-antique-gold/20 text-parchment/70 text-xs font-header tracking-widest uppercase"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={relinkSubmitting || !relinkParentId}
              className="py-2.5 btn-lacquer text-xs font-header tracking-widest uppercase disabled:opacity-50"
            >
              {relinkSubmitting ? "Dang Luu..." : "Luu Lien Ket"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
