"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, RefreshCw, Plus, Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MONTH_NAMES_VI = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const DAY_NAMES_VI = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

const DUTY_PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-slate-800 text-slate-400",
  MEDIUM: "bg-amber-950/50 text-amber-400/70",
  HIGH: "bg-orange-950/50 text-orange-400/70",
  URGENT: "bg-red-950/50 text-red-400/80",
};
const DUTY_CATEGORY_BADGE: Record<string, string> = {
  GRAVE_CARE: "bg-stone-800 text-stone-300/70",
  RITUAL_PREP: "bg-purple-950/50 text-purple-300/70",
  DOCUMENTATION: "bg-blue-950/50 text-blue-300/70",
  MEDIA_UPLOAD: "bg-teal-950/50 text-teal-300/70",
  ADMIN: "bg-indigo-950/50 text-indigo-300/70",
  OTHER: "bg-zinc-800 text-zinc-400",
};

interface Ritual {
  id: string;
  title: string;
  dateSolar: string | null;
  dateLunar: string | null;
  isRecurring: boolean;
  isCertified: boolean;
  ancestor?: { id: string; fullName: string } | null;
}

interface DutyItem {
  id: string;
  title: string;
  priority: string;
  category: string;
  status: string;
  progress: number;
  dueDate?: string | null;
  assignee?: { id: string; fullName: string } | null;
}

interface CalendarItem {
  id: string;
  title: string;
  type: "ritual" | "duty";
  dotColor: string;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}
function firstDow(y: number, m: number) {
  return new Date(y, m - 1, 1).getDay();
}

export default function RitualCalendarClient() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const addModal = useModal();
  const editModal = useModal();
  const [editingRitual, setEditingRitual] = useState<Ritual | null>(null);

  const { data, mutate } = useSWR(
    `/api/v1/rituals?year=${year}&month=${month}&limit=200`,
    fetcher
  );
  const rituals: Ritual[] = data?.data?.data ?? [];

  // Duties data (shared SWR cache with Kanban tab)
  const { data: dutiesData } = useSWR("/api/v1/duties?limit=200", fetcher);
  const duties: DutyItem[] = dutiesData?.data?.data ?? [];

  // Map date-string → Ritual[]
  const ritualsByDate = useMemo(() => {
    const map = new Map<string, Ritual[]>();
    for (const r of rituals) {
      if (!r.dateSolar) continue;
      const d = r.dateSolar.slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(r);
    }
    return map;
  }, [rituals]);

  // Map date-string → DutyItem[]
  const dutiesByDate = useMemo(() => {
    const map = new Map<string, DutyItem[]>();
    for (const d of duties) {
      if (!d.dueDate) continue;
      const dateKey = d.dueDate.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(d);
    }
    return map;
  }, [duties]);

  // Merged calendar items (rituals + duties) for cell display
  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const [date, rList] of ritualsByDate) {
      if (!map.has(date)) map.set(date, []);
      for (const r of rList) {
        map.get(date)!.push({
          id: r.id,
          title: r.title,
          type: "ritual",
          dotColor: r.isCertified ? "bg-emerald-500" : "bg-imperial-crimson/60",
        });
      }
    }
    for (const [date, dList] of dutiesByDate) {
      if (!map.has(date)) map.set(date, []);
      for (const d of dList) {
        const isUrgentHigh = d.priority === "URGENT" || d.priority === "HIGH";
        map.get(date)!.push({
          id: `duty-${d.id}`,
          title: d.title,
          type: "duty",
          dotColor: isUrgentHigh ? "bg-amber-500" : "bg-blue-400",
        });
      }
    }
    return map;
  }, [ritualsByDate, dutiesByDate]);

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDow(year, month);
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const selectedDateStr = selectedDay
    ? `${year}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;
  const selectedRituals = selectedDateStr ? (ritualsByDate.get(selectedDateStr) ?? []) : [];
  const selectedDuties = selectedDateStr ? (dutiesByDate.get(selectedDateStr) ?? []) : [];
  const selectedDayName = selectedDay && selectedDateStr
    ? DAY_NAMES_VI[new Date(selectedDateStr).getDay()]
    : null;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* ── Calendar ── */}
      <div className="flex-1 p-6 overflow-y-auto heritage-scroll">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-antique-gold/60 hover:text-antique-gold px-3 py-2 font-header tracking-widest text-sm transition-colors flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            Trước
          </button>
          <h2 className="font-header text-2xl text-gold-leaf tracking-widest uppercase">
            {MONTH_NAMES_VI[month - 1]} {year}
          </h2>
          <button onClick={nextMonth} className="text-antique-gold/60 hover:text-antique-gold px-3 py-2 font-header tracking-widest text-sm transition-colors flex items-center gap-1.5">
            Sau
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {DOW_VI.map((d, i) => (
            <div key={d} className={`text-center text-xs font-header tracking-widest uppercase py-2 ${i === 0 ? "text-imperial-crimson/60" : "text-antique-gold/50"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-l border-t border-antique-gold/10">
          {Array.from({ length: totalCells }).map((_, i) => {
            const day = i - firstDay + 1;
            const isCurrentMonth = day >= 1 && day <= totalDays;
            const isToday = isCurrentMonth && day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
            const dateStr = isCurrentMonth
              ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : null;
            const dayTasks = dateStr ? (tasksByDate.get(dateStr) ?? []) : [];
            const visibleTasks = dayTasks.slice(0, 3);
            const overflowCount = dayTasks.length - 3;
            const isSelected = isCurrentMonth && day === selectedDay;

            return (
              <div
                key={i}
                onClick={() => isCurrentMonth && setSelectedDay(day)}
                className={`relative group border-r border-b border-antique-gold/10 min-h-[100px] p-2 transition-all ${
                  isCurrentMonth ? "cursor-pointer hover:bg-antique-gold/5 hover:shadow-md" : "opacity-20 pointer-events-none"
                } ${isSelected ? "bg-imperial-crimson/15 border-imperial-crimson/30" : ""}`}
              >
                <div className={`text-sm font-bold font-header w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? "bg-imperial-crimson text-parchment" :
                  isCurrentMonth ? "text-parchment/70" : "text-parchment/20"
                }`}>
                  {isCurrentMonth ? day : ""}
                </div>
                {visibleTasks.map((task) => (
                  <div key={task.id} className="mt-1 flex items-center gap-1 overflow-hidden">
                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${task.dotColor}`} aria-hidden="true" />
                    <span className="text-[11px] font-sans text-parchment/70 truncate leading-tight">{task.title}</span>
                  </div>
                ))}
                {overflowCount > 0 && (
                  <div className="text-[10px] text-antique-gold/40 font-sans mt-0.5 pl-2.5">+{overflowCount} thêm</div>
                )}
                {isCurrentMonth && (
                  <button
                    aria-label={`Thêm ngày ${day}/${month}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDay(day);
                      addModal.open();
                    }}
                    className="absolute bottom-1 right-1 w-5 h-5 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity duration-150 bg-imperial-crimson/60 hover:bg-imperial-crimson/90 text-parchment rounded-full flex items-center justify-center text-xs leading-none"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <aside className="w-full lg:w-80 bg-lacquer-dark/80 border-t lg:border-t-0 lg:border-l border-antique-gold/20 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-antique-gold/10 flex items-center justify-between">
          <div>
            <h3 className="font-header text-gold-leaf text-base tracking-widest uppercase leading-snug">
              {selectedDay
                ? `${String(selectedDay).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
                : "Chọn Ngày"}
            </h3>
            {selectedDayName && (
              <p className="font-sans text-parchment/50 text-sm mt-0.5">{selectedDayName}</p>
            )}
          </div>
          <button
            onClick={addModal.open}
            className="btn-lacquer px-3 py-2 text-sm font-bold font-header tracking-widest uppercase flex items-center gap-1 min-h-[44px]"
          >
            <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Thêm
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 heritage-scroll">
          {/* No day selected: show month overview */}
          {!selectedDay && (
            <>
              <p className="font-sans text-parchment/50 text-sm text-center mt-4">
                Chọn ngày để xem nghi lễ.
              </p>
              <div className="mt-6">
                <p className="font-header text-antique-gold/50 text-xs tracking-widest uppercase mb-3">Tháng Này</p>
                {rituals.slice(0, 10).map((r) => (
                  <RitualCard key={r.id} ritual={r} onEdit={(r) => { setEditingRitual(r); editModal.open(); }} />
                ))}
              </div>
            </>
          )}

          {/* Selected day: empty state */}
          {selectedDay && selectedRituals.length === 0 && selectedDuties.length === 0 && (
            <div className="text-center mt-8 px-2">
              <p className="font-sans text-parchment/50 text-sm mb-6">Không có nghi lễ ngày này.</p>
              <button
                onClick={addModal.open}
                className="btn-lacquer w-full py-3 text-sm font-bold font-header tracking-widest uppercase min-h-[48px]"
              >
                + Thêm Nghi Lễ
              </button>
            </div>
          )}

          {/* Selected day: rituals section */}
          {selectedDay && selectedRituals.length > 0 && (
            <div>
              <p className="font-header text-antique-gold/50 text-xs tracking-widest uppercase mb-2">🔥 Nghi Lễ</p>
              {selectedRituals.map((r) => (
                <RitualCard key={r.id} ritual={r} onEdit={(r) => { setEditingRitual(r); editModal.open(); }} />
              ))}
            </div>
          )}

          {/* Selected day: duties section */}
          {selectedDay && selectedDuties.length > 0 && (
            <div className={selectedRituals.length > 0 ? "mt-4" : ""}>
              <p className="font-header text-antique-gold/50 text-xs tracking-widest uppercase mb-2">📋 Nhiệm Vụ</p>
              {selectedDuties.map((d) => (
                <DutyPanelCard key={d.id} duty={d} />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Add Ritual Modal */}
      <Modal isOpen={addModal.isOpen} onClose={addModal.close} title="Thêm Nghi Lễ">
        <AddRitualForm
          defaultDate={selectedDateStr ?? undefined}
          onClose={addModal.close}
          onCreated={() => { mutate(); addModal.close(); }}
        />
      </Modal>

      {/* Edit Ritual Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => { editModal.close(); setEditingRitual(null); }}
        title="Sửa Ngĩ Lễ"
      >
        {editingRitual && (
          <EditRitualForm
            ritual={editingRitual}
            onClose={() => { editModal.close(); setEditingRitual(null); }}
            onSaved={() => { mutate(); editModal.close(); setEditingRitual(null); }}
          />
        )}
      </Modal>
    </div>
  );
}

function RitualCard({ ritual, onEdit }: { ritual: Ritual; onEdit?: (r: Ritual) => void }) {
  return (
    <div className="border border-antique-gold/20 bg-panel-dark/60 p-4 space-y-1.5 mb-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-header text-parchment text-base tracking-wide leading-snug">{ritual.title}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {ritual.isCertified && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded tracking-wide">✓ XÁC NHẬN</span>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(ritual)}
              aria-label="Sửa nghi lễ"
              className="text-antique-gold/60 hover:text-antique-gold transition-colors p-1 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
              title="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
      {ritual.ancestor && (
        <p className="font-sans text-parchment/50 text-sm">Giỗ: {ritual.ancestor.fullName}</p>
      )}
      {ritual.dateLunar && (
        <p className="font-sans text-antique-gold/50 text-xs">Âm lịch: {ritual.dateLunar}</p>
      )}
      {ritual.isRecurring && (
        <span className="text-xs text-antique-gold/50 font-header tracking-widest flex items-center gap-1">
          <RefreshCw className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
          Hàng Năm
        </span>
      )}
    </div>
  );
}

function DutyPanelCard({ duty }: { duty: DutyItem }) {
  return (
    <div className="border border-antique-gold/15 bg-panel-dark/60 p-4 space-y-1.5 mb-2">
      <p className="font-header text-parchment text-base tracking-wide leading-snug">{duty.title}</p>
      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs px-1.5 py-0.5 font-sans rounded-sm ${DUTY_PRIORITY_BADGE[duty.priority] ?? "bg-zinc-800 text-zinc-400"}`}>
          {duty.priority}
        </span>
        <span className={`text-xs px-1.5 py-0.5 font-sans rounded-sm ${DUTY_CATEGORY_BADGE[duty.category] ?? "bg-zinc-800 text-zinc-400"}`}>
          {duty.category.replace("_", " ")}
        </span>
      </div>
      {typeof duty.progress === "number" && duty.progress > 0 && (
        <div>
          <div className="flex justify-between text-xs text-parchment/50 font-sans mb-0.5">
            <span>Tiến độ</span>
            <span>{duty.progress}%</span>
          </div>
          <div className="h-1.5 bg-black/40 rounded-full">
            <div className="h-1.5 bg-imperial-crimson/60 rounded-full" style={{ width: `${duty.progress}%` }} />
          </div>
        </div>
      )}
      {duty.assignee && (
        <p className="font-sans text-parchment/50 text-xs">→ {duty.assignee.fullName}</p>
      )}
    </div>
  );
}

function AddRitualForm({
  defaultDate,
  onClose,
  onCreated,
}: {
  defaultDate?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    dateSolar: defaultDate ?? "",
    dateLunar: "",
    isRecurring: true,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/rituals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi tạo nghi lễ");
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-950/50 border border-imperial-crimson/50 text-parchment/80 text-sm px-4 py-3 font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Tên Nghi Lễ *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Ngày Dương *</label>
              <input
                type="date"
                required
                value={form.dateSolar}
                onChange={(e) => setForm({ ...form, dateSolar: e.target.value })}
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Ngày Âm</label>
              <input
                placeholder="VD: 15 tháng 7 âm"
                value={form.dateLunar}
                onChange={(e) => setForm({ ...form, dateLunar: e.target.value })}
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="accent-imperial-crimson"
            />
            <span className="font-sans text-parchment/70 text-sm">Lặp lại hàng năm</span>
          </label>
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
  );
}

function EditRitualForm({
  ritual,
  onClose,
  onSaved,
}: {
  ritual: Ritual;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: ritual.title,
    dateSolar: ritual.dateSolar?.slice(0, 10) ?? "",
    dateLunar: ritual.dateLunar ?? "",
    isRecurring: ritual.isRecurring,
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/rituals/${ritual.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          dateSolar: form.dateSolar || undefined,
          dateLunar: form.dateLunar || null,
          isRecurring: form.isRecurring,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi cập nhật nghi lễ");
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-950/50 border border-imperial-crimson/50 text-parchment/80 text-sm px-4 py-3 font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Tên Nghi Lễ *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Ngày Dương</label>
              <input
                type="date"
                value={form.dateSolar}
                onChange={(e) => setForm({ ...form, dateSolar: e.target.value })}
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Ngày Âm</label>
              <input
                placeholder="VD: 15 tháng 7 âm"
                value={form.dateLunar}
                onChange={(e) => setForm({ ...form, dateLunar: e.target.value })}
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="accent-imperial-crimson"
            />
            <span className="font-sans text-parchment/70 text-sm">Lặp lại hàng năm</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-antique-gold/20 text-parchment/60 text-sm font-header tracking-widest uppercase hover:border-antique-gold/50 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="flex-1 btn-lacquer py-2.5 text-sm font-header tracking-widest uppercase disabled:opacity-50">
              {submitting ? "Đang Lưu…" : "Lưu Thay Đổi"}
            </button>
          </div>
      </form>
    </div>
  );
}
