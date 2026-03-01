"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MONTH_NAMES_VI = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface Ritual {
  id: string;
  title: string;
  dateSolar: string | null;
  dateLunar: string | null;
  isRecurring: boolean;
  isCertified: boolean;
  ancestor?: { id: string; fullName: string } | null;
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
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, mutate } = useSWR(
    `/api/v1/rituals?year=${year}&month=${month}&limit=200`,
    fetcher
  );
  const rituals: Ritual[] = data?.data?.data ?? [];

  // Map date-string → ritual[]
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

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-64px)]">
      {/* ── Calendar ── */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-antique-gold/60 hover:text-antique-gold px-3 py-2 font-header tracking-widest text-sm transition-colors">
            ← Trước
          </button>
          <h2 className="font-header text-2xl text-gold-leaf tracking-widest uppercase">
            {MONTH_NAMES_VI[month - 1]} {year}
          </h2>
          <button onClick={nextMonth} className="text-antique-gold/60 hover:text-antique-gold px-3 py-2 font-header tracking-widest text-sm transition-colors">
            Sau →
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
            const dayRituals = dateStr ? (ritualsByDate.get(dateStr) ?? []) : [];
            const isSelected = isCurrentMonth && day === selectedDay;

            return (
              <div
                key={i}
                onClick={() => isCurrentMonth && setSelectedDay(day === selectedDay ? null : day)}
                className={`border-r border-b border-antique-gold/10 min-h-[80px] p-2 transition-all ${
                  isCurrentMonth ? "cursor-pointer hover:bg-antique-gold/5" : "opacity-20"
                } ${isSelected ? "bg-imperial-crimson/15 border-imperial-crimson/30" : ""}`}
              >
                <div className={`text-xs font-header w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? "bg-imperial-crimson text-parchment" :
                  isCurrentMonth ? "text-parchment/70" : "text-parchment/20"
                }`}>
                  {isCurrentMonth ? day : ""}
                </div>
                {dayRituals.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className={`mt-1 text-xs truncate px-1 py-0.5 font-sans ${
                      r.isCertified
                        ? "bg-emerald-950/60 text-emerald-400/80 border border-emerald-900/30"
                        : "bg-imperial-crimson/20 text-parchment/70 border border-imperial-crimson/20"
                    }`}
                  >
                    {r.title}
                  </div>
                ))}
                {dayRituals.length > 3 && (
                  <div className="text-xs text-antique-gold/40 font-sans mt-0.5">+{dayRituals.length - 3}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <aside className="w-full lg:w-80 bg-lacquer-dark/80 border-t lg:border-t-0 lg:border-l border-antique-gold/20 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-antique-gold/10 flex items-center justify-between">
          <h3 className="font-header text-gold-leaf text-sm tracking-widest uppercase">
            {selectedDay
              ? `${String(selectedDay).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
              : "Chọn Ngày"}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-lacquer px-3 py-1.5 text-xs font-header tracking-widest uppercase"
          >
            + Thêm
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedDay && selectedRituals.length === 0 && (
            <p className="font-sans text-parchment/30 text-sm text-center mt-8">Không có lễ giỗ ngày này.</p>
          )}
          {!selectedDay && (
            <>
              <p className="font-sans text-parchment/30 text-sm text-center mt-4">
                Chọn ngày để xem nghi lễ.
              </p>
              <div className="mt-6">
                <p className="font-header text-antique-gold/50 text-xs tracking-widest uppercase mb-3">Tháng Này</p>
                {rituals.slice(0, 10).map((r) => (
                  <RitualCard key={r.id} ritual={r} />
                ))}
              </div>
            </>
          )}
          {selectedRituals.map((r) => (
            <RitualCard key={r.id} ritual={r} />
          ))}
        </div>
      </aside>

      {/* Add Ritual Modal */}
      {showAddModal && (
        <AddRitualModal
          defaultDate={selectedDateStr ?? undefined}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { mutate(); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}

function RitualCard({ ritual }: { ritual: Ritual }) {
  return (
    <div className="border border-antique-gold/20 bg-panel-dark/60 p-4 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-header text-parchment text-sm tracking-wide leading-snug">{ritual.title}</p>
        {ritual.isCertified && (
          <span className="text-xs text-emerald-400/70 font-header flex-shrink-0">✓</span>
        )}
      </div>
      {ritual.ancestor && (
        <p className="font-sans text-parchment/50 text-xs">Giỗ: {ritual.ancestor.fullName}</p>
      )}
      {ritual.dateLunar && (
        <p className="font-sans text-antique-gold/50 text-xs">Âm lịch: {ritual.dateLunar}</p>
      )}
      {ritual.isRecurring && (
        <span className="text-xs text-antique-gold/40 font-header tracking-widest">↻ Hàng Năm</span>
      )}
    </div>
  );
}

function AddRitualModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-bg-dark border border-antique-gold/30 p-8 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-header text-xl text-gold-leaf tracking-widest uppercase">Thêm Nghi Lễ</h2>
          <button onClick={onClose} className="text-parchment/40 hover:text-parchment text-xl">✕</button>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-imperial-crimson/50 text-parchment/80 text-sm px-4 py-3 mb-4 font-sans">
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
    </div>
  );
}
