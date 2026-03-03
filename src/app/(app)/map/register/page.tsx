"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MemberOption {
  id: string;
  fullName: string;
}

export default function RegisterSitePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    memberId: "",
    sectionPlot: "",
    latitude: "",
    longitude: "",
    epitaph: "",
    condition: "MAINTAINED",
    siteType: "CEMETERY",
    lastVisited: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: membersData } = useSWR("/api/v1/members?limit=200", fetcher);
  const members: MemberOption[] = membersData?.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!form.memberId) {
      setError("Vui lòng chọn thành viên");
      setSubmitting(false);
      return;
    }
    if (!form.latitude || !form.longitude) {
      setError("Vui lòng nhập tọa độ");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: form.memberId,
          sectionPlot: form.sectionPlot || null,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          epitaph: form.epitaph || null,
          condition: form.condition,
          siteType: form.siteType,
          lastVisited: form.lastVisited || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi tạo mộ phần");
      router.push("/map");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-antique-gold/60 hover:text-antique-gold text-xs font-header tracking-widest uppercase transition-colors">
          ← Trở Lại
        </button>
      </div>

      <div className="border border-antique-gold/30 bg-panel-dark/60 p-8">
        <h1 className="font-header text-2xl text-gold-leaf tracking-wider uppercase mb-6">Đăng Ký Mộ Phần</h1>

        {error && (
          <div className="bg-red-950/50 border border-imperial-crimson/50 text-parchment/80 text-sm px-4 py-3 mb-6 font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Thành Viên *</label>
            <select
              required
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            >
              <option value="">— Chọn thành viên —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Khu / Lô Mộ</label>
            <input
              value={form.sectionPlot}
              onChange={(e) => setForm({ ...form, sectionPlot: e.target.value })}
              placeholder="Ví dụ: Khu A, Lô 12 - Nghĩa trang Bình An"
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Vĩ Độ</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="15.1234"
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Kinh Độ</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="108.2345"
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Tình Trạng</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              >
                {[
                  { value: "MAINTAINED", label: "Tốt" },
                  { value: "NEEDS_VISIT", label: "Cần Viếng" },
                  { value: "WEATHERED", label: "Phong Hóa" },
                  { value: "RESTORATION", label: "Trùng Tu" },
                ].map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Loại</label>
              <select
                value={form.siteType}
                onChange={(e) => setForm({ ...form, siteType: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              >
                {[
                  { value: "TEMPLE", label: "Đền / Chùa" },
                  { value: "CHURCH", label: "Nhà Thờ" },
                  { value: "CEMETERY", label: "Nghĩa Trang" },
                  { value: "PRIVATE", label: "Đất Riêng" },
                  { value: "OTHER", label: "Khác" },
                ].map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Bia Ký / Văn Bia</label>
            <textarea
              value={form.epitaph}
              onChange={(e) => setForm({ ...form, epitaph: e.target.value })}
              rows={3}
              placeholder="Nội dung văn bia (nếu có)"
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">Ngày Viếng Gần Nhất</label>
            <input
              type="date"
              value={form.lastVisited}
              onChange={(e) => setForm({ ...form, lastVisited: e.target.value })}
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-lacquer w-full py-3 text-sm font-header tracking-widest uppercase disabled:opacity-50"
          >
            {submitting ? "Đang Lưu…" : "Đăng Ký Mộ Phần"}
          </button>
        </form>
      </div>
    </div>
  );
}
