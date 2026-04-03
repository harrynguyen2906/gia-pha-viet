"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface MemberOption {
  id: string;
  fullName: string;
  generation?: number | null;
  isDeceased: boolean;
}

interface AddMemberFormProps {
  defaultParentId?: string;
  defaultParentOption?: MemberOption | null;
  mode?: "page" | "modal";
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Derive generation from a parent member
function childGeneration(parent?: MemberOption | null): number {
  if (parent?.generation != null) return parent.generation + 1;
  return 1;
}

export default function AddMemberForm({
  defaultParentId = "",
  defaultParentOption = null,
  mode = "page",
  onSuccess,
  onCancel,
}: AddMemberFormProps) {
  const router = useRouter();

  const resolvedParentId = defaultParentOption?.id ?? defaultParentId.trim();
  const initialGeneration = childGeneration(defaultParentOption);

  const [form, setForm] = useState({
    fullName: "",
    gender: "MALE",
    isDeceased: false,
    generation: initialGeneration,
    lineageRole: "MEMBER",
    branchName: "",
    birthDateSolar: "",
    birthDateLunar: "",
    deathDateSolar: "",
    deathDateLunar: "",
    biography: "",
  });
  const [parentId, setParentId] = useState<string>(resolvedParentId);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep parent and generation in sync with external defaults, even if
  // the form is reused without a full remount.
  useEffect(() => {
    setParentId(resolvedParentId);

    const parentFromList = members.find((m) => m.id === resolvedParentId);
    const nextGeneration =
      defaultParentOption?.generation != null
        ? defaultParentOption.generation + 1
        : parentFromList?.generation != null
          ? parentFromList.generation + 1
          : 1;

    setForm((prev) => ({ ...prev, generation: nextGeneration }));
  }, [resolvedParentId, defaultParentOption?.generation, members]);

  // Load member list. Inject the seeded parent at the top so the select
  // can immediately resolve the default parent value.
  useEffect(() => {
    fetch("/api/v1/members?limit=200")
      .then((r) => r.json())
      .then((d) => {
        const list: MemberOption[] = d?.data?.data ?? [];
        if (defaultParentOption && !list.some((m) => m.id === defaultParentOption.id)) {
          list.unshift(defaultParentOption);
        }
        setMembers(list);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleParentChange = (nextParentId: string) => {
    setParentId(nextParentId);
    if (!nextParentId) return;
    const parent = members.find((m) => m.id === nextParentId);
    if (parent?.generation != null) {
      setForm((prev) => ({ ...prev, generation: parent.generation! + 1 }));
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.back();
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push("/lineage");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
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
      if (!res.ok) throw new Error(data.error ?? "Loi tao thanh vien");

      const newMemberId = data.data?.id ?? data.id;

      const validParentId = parentId.trim() || null;
      const validNewMemberId = typeof newMemberId === "string" ? newMemberId.trim() : null;

      if (validParentId && validNewMemberId) {
        const relRes = await fetch("/api/v1/relationships", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: validParentId, childId: validNewMemberId }),
        });

        if (!relRes.ok) {
          const relData = await relRes.json().catch(() => ({}));
          console.error("Failed to create relationship", relData);
        }
      }

      handleSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={mode === "page" ? "max-w-2xl mx-auto px-4 py-10" : "px-5 py-5"}>
      {mode === "page" && (
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-antique-gold/60 hover:text-antique-gold text-xs font-header tracking-widest uppercase transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            Tro Lai
          </button>
        </div>
      )}

      <div className={mode === "page" ? "border border-antique-gold/30 bg-panel-dark/60 p-8" : ""}>
        {mode === "page" && (
          <div className="flex items-center gap-4 border-b border-antique-gold/20 pb-5 mb-7">
            <h1 className="font-header text-2xl text-gold-leaf tracking-wider uppercase">
              Them Thanh Vien
            </h1>
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 border border-imperial-crimson/50 text-parchment/80 text-sm px-4 py-3 mb-6 font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
              Ho va Ten *
            </label>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Vi du: Nguyen Van A"
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Gioi Tinh
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nu</option>
                <option value="OTHER">Khac</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Vai Tro
              </label>
              <select
                value={form.lineageRole}
                onChange={(e) => setForm({ ...form, lineageRole: e.target.value })}
                className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              >
                <option value="MEMBER">Thanh Vien</option>
                <option value="HEAD_OF_HOUSE">Toc Truong</option>
                <option value="ELDER">Bac Truong</option>
                <option value="HEIR">Thua Tu</option>
                <option value="YOUTH">Thanh Nien</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Doi Thu
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
                Chi / Nhanh
              </label>
              <input
                value={form.branchName}
                onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                placeholder="Vi du: Chi Ca, Chi Nhi"
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
              Cha / Me (tuy chon)
            </label>
            <select
              value={parentId}
              onChange={(e) => handleParentChange(e.target.value)}
              className="w-full bg-panel-dark border border-antique-gold/20 text-parchment text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
            >
              <option value="">- Khong chon -</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                  {m.generation ? ` (Doi ${m.generation})` : ""}
                  {m.isDeceased ? " +" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                Ngay Sinh (Duong)
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
                Ngay Sinh (Am)
              </label>
              <input
                value={form.birthDateLunar}
                onChange={(e) => setForm({ ...form, birthDateLunar: e.target.value })}
                placeholder="VD: 10 thang 3 am"
                className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDeceased}
              onChange={(e) => setForm({ ...form, isDeceased: e.target.checked })}
              className="accent-imperial-crimson w-4 h-4"
            />
            <span className="font-sans text-parchment/70 text-sm">Da Khuat</span>
          </label>

          {form.isDeceased && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
                  Ngay Mat (Duong)
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
                  Ngay Mat (Am)
                </label>
                <input
                  value={form.deathDateLunar}
                  onChange={(e) => setForm({ ...form, deathDateLunar: e.target.value })}
                  placeholder="VD: 10 thang 3 am"
                  className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-header tracking-widest uppercase text-antique-gold/70 block mb-1.5">
              Tieu Su
            </label>
            <textarea
              rows={4}
              value={form.biography}
              onChange={(e) => setForm({ ...form, biography: e.target.value })}
              placeholder="Ghi chu ve cuoc doi, cong duc, su nghiep..."
              className="w-full bg-black/30 border border-antique-gold/20 text-parchment placeholder:text-parchment/20 text-sm px-4 py-2.5 focus:outline-none focus:border-antique-gold/60 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 border border-antique-gold/20 text-parchment/60 text-sm font-header tracking-widest uppercase hover:border-antique-gold/50 transition-colors"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-lacquer py-2.5 text-sm font-header tracking-widest uppercase disabled:opacity-50"
            >
              {submitting ? "Dang Luu..." : "Them Thanh Vien"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
