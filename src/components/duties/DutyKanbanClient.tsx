"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DutyStats {
  total: number;
  byStatus: { queue: number; active: number; completed: number; verified: number; cancelled: number };
  overdue: number;
  efficiencyRating: number;
  pendingReview: number;
}

interface WorkloadEntry {
  member: { id: string; fullName: string; generation?: number | null; avatarUrl?: string | null };
  activeDuties: number;
  completedDuties: number;
  totalDuties: number;
  completionRate: number;
  level: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Duty {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category: string;
  progress: number;
  dueDate?: string | null;
  assignee?: { id: string; fullName: string } | null;
}

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: "QUEUE", label: "Chờ Xử Lý", color: "border-parchment/20" },
  { key: "ACTIVE", label: "Đang Thực Hiện", color: "border-antique-gold/40" },
  { key: "COMPLETED", label: "Hoàn Thành", color: "border-emerald-700/40" },
  { key: "VERIFIED", label: "Đã Xác Nhận", color: "border-blue-700/40" },
];

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-slate-800 text-slate-400",
  MEDIUM: "bg-amber-950/50 text-amber-400/70",
  HIGH: "bg-orange-950/50 text-orange-400/70",
  URGENT: "bg-red-950/50 text-red-400/80",
};

const CATEGORY_BADGE: Record<string, string> = {
  GRAVE_CARE: "bg-stone-800 text-stone-300/70",
  RITUAL_PREP: "bg-purple-950/50 text-purple-300/70",
  DOCUMENTATION: "bg-blue-950/50 text-blue-300/70",
  MEDIA_UPLOAD: "bg-teal-950/50 text-teal-300/70",
  ADMIN: "bg-indigo-950/50 text-indigo-300/70",
  OTHER: "bg-zinc-800 text-zinc-400",
};

export default function DutyKanbanClient() {
  const { data, mutate } = useSWR("/api/v1/duties?limit=200", fetcher);
  const duties: Duty[] = data?.data?.data ?? [];

  const { data: statsData } = useSWR<{ data: DutyStats }>("/api/v1/duties/stats", fetcher);
  const stats = statsData?.data;

  const { data: workloadData } = useSWR<{ data: WorkloadEntry[] }>("/api/v1/members/workload", fetcher);
  const workload: WorkloadEntry[] = workloadData?.data ?? [];

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"kanban" | "workload">("kanban");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byColumn = useCallback((status: string) => duties.filter((d) => d.status === status), [duties]);

  const activeDuty = activeId ? duties.find((d) => d.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    // over.id can be a column key (QUEUE/ACTIVE/...) or a duty id
    const targetStatus = COLUMNS.find((c) => c.key === over.id)?.key;
    if (!targetStatus) return;

    const duty = duties.find((d) => d.id === active.id);
    if (!duty || duty.status === targetStatus) return;

    // Optimistic update
    mutate(
      { ...data, data: duties.map((d) => (d.id === active.id ? { ...d, status: targetStatus } : d)) },
      false
    );

    await fetch(`/api/v1/duties/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });

    mutate();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* ── Stats Header ── */}
      {stats && (
        <div className="border-b border-antique-gold/15 bg-lacquer-dark/60 px-6 py-3 grid grid-cols-3 sm:grid-cols-6 gap-4">
          {[
            { label: "Tổng", value: stats.total },
            { label: "Chờ", value: stats.byStatus.queue },
            { label: "Đang Làm", value: stats.byStatus.active },
            { label: "Xong", value: stats.byStatus.completed + stats.byStatus.verified },
            { label: "Quá Hạn", value: stats.overdue, warn: stats.overdue > 0 },
            { label: "Hiệu Suất", value: `${stats.efficiencyRating}%` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p
                className={`font-header text-xl font-black ${s.warn ? "text-imperial-crimson" : "text-antique-gold"}`}
                style={!s.warn ? {
                  background: "linear-gradient(to bottom, #fceabb, #fccd4d)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                } : {}}
              >
                {s.value}
              </p>
              <p className="text-parchment/40 text-xs font-header tracking-widest uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="border-b border-antique-gold/20 bg-lacquer-dark/80 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("kanban")}
            className={`px-4 py-1.5 text-xs font-header tracking-widest uppercase border transition-colors ${
              activeTab === "kanban"
                ? "bg-imperial-crimson border-antique-gold/50 text-parchment"
                : "border-antique-gold/20 text-antique-gold/50 hover:border-antique-gold/50"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setActiveTab("workload")}
            className={`px-4 py-1.5 text-xs font-header tracking-widest uppercase border transition-colors ${
              activeTab === "workload"
                ? "bg-imperial-crimson border-antique-gold/50 text-parchment"
                : "border-antique-gold/20 text-antique-gold/50 hover:border-antique-gold/50"
            }`}
          >
            Phân Công
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-parchment/40 text-xs font-sans">{duties.length} nhiệm vụ</span>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-lacquer px-4 py-1.5 text-xs font-header tracking-widest uppercase"
          >
            + Thêm
          </button>
        </div>
      </div>

      {/* ── Workload Table ── */}
      {activeTab === "workload" && (
        <div className="flex-1 overflow-auto p-6">
          {workload.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="font-header text-antique-gold/30 text-sm tracking-widest">Chưa có dữ liệu phân công</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-antique-gold/20">
                  {["Thành Viên", "Đời", "Đang Làm", "Hoàn Thành", "Tổng", "Tỷ Lệ", "Mức Độ"].map((h) => (
                    <th key={h} className="text-left text-xs font-header tracking-widest uppercase text-antique-gold/60 pb-3 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workload.map((w) => (
                  <tr key={w.member.id} className="border-b border-antique-gold/10 hover:bg-antique-gold/5 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-header text-parchment/90 text-sm tracking-wide">{w.member.fullName}</span>
                    </td>
                    <td className="py-3 pr-4 text-parchment/50 text-xs font-sans">
                      {w.member.generation ? `Đời ${w.member.generation}` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-antique-gold font-header text-sm">{w.activeDuties}</td>
                    <td className="py-3 pr-4 text-emerald-400/80 font-header text-sm">{w.completedDuties}</td>
                    <td className="py-3 pr-4 text-parchment/60 font-header text-sm">{w.totalDuties}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-black/40 rounded-full">
                          <div
                            className="h-1.5 bg-imperial-crimson/60 rounded-full"
                            style={{ width: `${w.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-parchment/50 font-sans">{w.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-header tracking-widest px-2 py-0.5 ${
                        w.level === "HIGH" ? "text-red-400 bg-red-950/40" :
                        w.level === "MEDIUM" ? "text-amber-400 bg-amber-950/40" :
                        "text-emerald-400/60 bg-emerald-950/30"
                      }`}>
                        {w.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Kanban Board */}
      {activeTab === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex h-full gap-4 p-6 min-w-max">
              {COLUMNS.map((col) => {
                const colDuties = byColumn(col.key);
                return (
                  <KanbanColumn
                    key={col.key}
                    column={col}
                    duties={colDuties}
                    onVerify={mutate}
                  />
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeDuty && <DutyCardDisplay duty={activeDuty} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      {showAddModal && (
        <AddDutyModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { mutate(); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  duties,
  onVerify,
}: {
  column: { key: string; label: string; color: string };
  duties: Duty[];
  onVerify: () => void;
}) {
  const { setNodeRef, isOver } = useSortable({ id: column.key, disabled: true });

  return (
    <div
      ref={setNodeRef}
      id={column.key}
      className={`w-72 flex-shrink-0 flex flex-col bg-lacquer-dark/60 border ${column.color} rounded-sm overflow-hidden ${isOver ? "ring-2 ring-antique-gold/40" : ""}`}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-antique-gold/10 flex items-center justify-between">
        <h3 className="font-header text-parchment/80 text-xs tracking-widest uppercase">{column.label}</h3>
        <span className="bg-antique-gold/10 text-antique-gold/60 text-xs font-sans px-2 py-0.5 rounded-full">
          {duties.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={duties.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {duties.map((duty) => (
            <SortableDutyCard key={duty.id} duty={duty} onVerify={onVerify} />
          ))}
          {duties.length === 0 && (
            <p className="text-center text-parchment/20 text-xs font-sans py-8">Trống</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableDutyCard({ duty, onVerify }: { duty: Duty; onVerify: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: duty.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DutyCardDisplay duty={duty} isDragging={isDragging} onVerify={onVerify} />
    </div>
  );
}

function DutyCardDisplay({
  duty,
  isDragging,
  onVerify,
}: {
  duty: Duty;
  isDragging?: boolean;
  onVerify?: () => void;
}) {
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifying(true);
    await fetch(`/api/v1/duties/${duty.id}/verify`, { method: "POST" });
    onVerify?.();
    setVerifying(false);
  };

  return (
    <div
      className={`bg-panel-dark border border-antique-gold/15 p-3 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 shadow-2xl ring-2 ring-antique-gold/30" : "hover:border-antique-gold/30"
      }`}
    >
      <p className="font-header text-parchment/90 text-xs tracking-wide leading-snug mb-2">{duty.title}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={`text-xs px-1.5 py-0.5 font-sans rounded-sm ${PRIORITY_BADGE[duty.priority] ?? "bg-zinc-800 text-zinc-400"}`}>
          {duty.priority}
        </span>
        <span className={`text-xs px-1.5 py-0.5 font-sans rounded-sm ${CATEGORY_BADGE[duty.category] ?? "bg-zinc-800 text-zinc-400"}`}>
          {duty.category.replace("_", " ")}
        </span>
      </div>
      {typeof duty.progress === "number" && duty.progress > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-parchment/30 font-sans mb-0.5">
            <span>Tiến độ</span>
            <span>{duty.progress}%</span>
          </div>
          <div className="h-1 bg-black/40 rounded-full">
            <div
              className="h-1 bg-imperial-crimson/60 rounded-full transition-all"
              style={{ width: `${duty.progress}%` }}
            />
          </div>
        </div>
      )}
      {duty.assignee && (
        <p className="font-sans text-parchment/40 text-xs truncate">→ {duty.assignee.fullName}</p>
      )}
      {duty.dueDate && (
        <p className="font-sans text-parchment/30 text-xs mt-1">
          Hạn: {new Date(duty.dueDate).toLocaleDateString("vi-VN")}
        </p>
      )}
      {duty.status === "COMPLETED" && onVerify && (
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="mt-2 w-full text-xs font-header tracking-widest uppercase border border-emerald-700/40 text-emerald-400/60 hover:text-emerald-400 hover:border-emerald-700/70 py-1 transition-colors disabled:opacity-40"
        >
          {verifying ? "…" : "Xác Nhận"}
        </button>
      )}
    </div>
  );
}

function AddDutyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
    assignedGroup: "ALL",
    dueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/duties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi tạo nhiệm vụ");
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-bg-dark border border-antique-gold/30 p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-header text-xl text-gold-leaf tracking-widest uppercase">Thêm Nhiệm Vụ</h2>
          <button onClick={onClose} className="text-parchment/40 hover:text-parchment text-xl">✕</button>
        </div>
        {error && (
          <div className="bg-red-950/50 border border-imperial-crimson/50 text-parchment/80 text-sm px-4 py-3 mb-4 font-sans">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Tên Nhiệm Vụ *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Danh Mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-3 py-2.5 focus:outline-none"
              >
                {["GRAVE_CARE", "RITUAL_PREP", "DOCUMENTATION", "MEDIA_UPLOAD", "ADMIN", "OTHER"].map((c) => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Ưu Tiên</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-3 py-2.5 focus:outline-none"
              >
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Mô Tả</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Hạn Chót</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-antique-gold/20 text-parchment/60 text-sm font-header tracking-widest uppercase hover:border-antique-gold/50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="flex-1 btn-lacquer py-2.5 text-sm font-header tracking-widest uppercase disabled:opacity-50">
              {submitting ? "Đang Lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
