"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface MemberOption {
  id: string;
  fullName: string;
  generation?: number | null;
  isDeceased: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function AddMemberForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultParentId = searchParams.get("parentId") ?? "";

  const [form, setForm] = useState({
    fullName: "",
    gender: "MALE",
    isDeceased: false,
    generation: 1,
    lineageRole: "MEMBER",
    branchName: "",
    birthDateSolar: "",
    birthDateLunar: "",
    deathDateSolar: "",
    deathDateLunar: "",
    biography: "",
  });
  const [parentId, setParentId] = useState<string>(defaultParentId);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/members?limit=200")
      .then((r) => r.json())
      .then((d) => {
        const list: MemberOption[] = d?.data?.data ?? [];
        setMembers(list);
        // Auto-fill generation from parent if parentId pre-selected
        if (defaultParentId) {
          const parent = list.find((m) => m.id === defaultParentId);
          if (parent?.generation) {
            setForm((f) => ({ ...f, generation: parent.generation! + 1 }));
          }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create member
      const res = await fetch("/api/v1/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          gender: form.gender,
          isDeceased: form.isDeceased,
          generation: Number(form.generation),
          lineageRole: form.lineageRole,
          branchName: form.branchName || null,
          birthDateSolar: form.birthDateSolar || null,
          birthDateLunar: form.birthDateLunar || null,
          deathDateSolar: form.deathDateSolar || null,
          deathDateLunar: form.deathDateLunar || null,
          biography: form.biography || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi tạo thành viên");

      const newMemberId = data.data?.id ?? data.id;

      // 2. Link parent if selected
      if (parentId && newMemberId) {
        await fetch("/api/v1/relationships", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId, childId: newMemberId }),
        });
      }

      router.push("/lineage");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const generation = Number(form.generation);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-antique-gold/60 hover:text-antique-gold text-xs font-header tracking-widest uppercase transition-colors"
        >
          ← Trở Lại
        </button>
      </div>

      <div className="border border-antique-gold/30 bg-panel-dark/60 p-8">
        <div className="flex items-center gap-4 border-b border-antique-gold/20 pb-5 mb-7">
          <h1 className="font-header text-2xl text-gold-leaf tracking-wider uppercase">
            Thêm Thành Viên
          </h1>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-imperial-crimson/50 text-parchment/80 text-sm px-4 py-3 mb-6 font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
              Họ và Tên *
            </label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>

          {/* Gender + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Giới Tính
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Vai Trò
              </label>
              <select
                value={form.lineageRole}
                onChange={(e) => setForm({ ...form, lineageRole: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              >
                <option value="MEMBER">Thành Viên</option>
                <option value="HEAD_OF_HOUSE">Tộc Trưởng</option>
                <option value="ELDER">Bậc Trưởng</option>
                <option value="HEIR">Thừa Tự</option>
                <option value="YOUTH">Thanh Niên</option>
              </select>
            </div>
          </div>

          {/* Generation + Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Đời Thứ
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.generation}
                onChange={(e) => setForm({ ...form, generation: Number(e.target.value) })}
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Chi / Nhánh
              </label>
              <input
                value={form.branchName}
                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                placeholder="Ví dụ: Chi Cả, Chi Nhì"
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
          </div>

          {/* Parent (optional) */}
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
              Cha / Mẹ (tuỳ chọn)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            >
              <option value="">— Không chọn —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                  {m.generation ? ` (Đời ${m.generation})` : ""}
                  {m.isDeceased ? " ✝" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Birth / Death dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Ngày Sinh (Dương)
              </label>
              <input
                type="date"
                value={form.birthDateSolar}
                onChange={(e) => setForm({ ...form, birthDateSolar: e.target.value })}
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Ngày Sinh (Âm)
              </label>
              <input
                value={form.birthDateLunar}
                onChange={(e) => setForm({ ...form, birthDateLunar: e.target.value })}
                placeholder="VD: 10 tháng 3 âm"
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
          </div>

          {/* Deceased toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDeceased}
              onChange={(e) => setForm({ ...form, isDeceased: e.target.checked })}
              className="accent-imperial-crimson w-4 h-4"
            />
            <span className="font-sans text-parchment/70 text-sm">Đã Khuất</span>
          </label>

          {/* Death dates (shown when deceased) */}
          {form.isDeceased && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                  Ngày Mất (Dương)
                </label>
                <input
                  type="date"
                  value={form.deathDateSolar}
                  onChange={(e) => setForm({ ...form, deathDateSolar: e.target.value })}
                  className="w-full bg-black/30 border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
                />
              </div>
              <div>
                <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                  Ngày Mất (Âm)
                </label>
                <input
                  value={form.deathDateLunar}
                  onChange={(e) => setForm({ ...form, deathDateLunar: e.target.value })}
                  placeholder="VD: 10 tháng 3 âm"
                  className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
                />
              </div>
            </div>
          )}

          {/* Biography */}
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
              Tiểu Sử
            </label>
            <textarea
              rows={4}
              value={form.biography}
              onChange={(e) => setForm({ ...form, biography: e.target.value })}
              placeholder="Ghi chú về cuộc đời, công đức, sự nghiệp…"
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2.5 border border-antique-gold/20 text-parchment/60 text-sm font-header tracking-widest uppercase hover:border-antique-gold/50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-lacquer py-2.5 text-sm font-header tracking-widest uppercase disabled:opacity-50"
            >
              {submitting ? "Đang Lưu…" : "Thêm Thành Viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddMemberPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">Đang tải…</p>
      </div>
    }>
      <AddMemberForm />
    </Suspense>
  );
}
