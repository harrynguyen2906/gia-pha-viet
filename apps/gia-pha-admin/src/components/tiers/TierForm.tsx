"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionTier } from "@/generated/prisma";

type TierFormProps = {
  tier?: SubscriptionTier;
  isEdit?: boolean;
};

type FeatureRow = {
  key: string;
  labelVi: string;
  labelEn: string;
  included: boolean;
  limitStr?: string;
};

export function TierForm({ tier, isEdit = false }: TierFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const [features, setFeatures] = useState<FeatureRow[]>(() => {
    if (!tier?.features) return [];
    try {
      const parsed = typeof tier.features === "string" ? JSON.parse(tier.features) : tier.features;
      return Array.isArray(parsed) ? parsed.map((p: any) => ({
        key: p.key || "",
        labelVi: p.labelVi || "",
        labelEn: p.labelEn || "",
        included: p.included ?? true,
        limitStr: p.limit?.toString() || ""
      })) : [];
    } catch {
      return [];
    }
  });

  const handleFeatureChange = (index: number, key: keyof FeatureRow, value: any) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [key]: value };
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, { key: "", labelVi: "", labelEn: "", included: true, limitStr: "" }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    
    const formData = new FormData(e.currentTarget);
    
    // Process features
    const finalFeatures = features.map(f => ({
      key: f.key,
      labelVi: f.labelVi,
      labelEn: f.labelEn,
      included: f.included,
      ...(f.limitStr ? { limit: Number(f.limitStr) } : {})
    }));

    const payload = {
      slug: formData.get("slug") as string,
      nameVi: formData.get("nameVi") as string,
      nameEn: formData.get("nameEn") as string,
      descriptionVi: formData.get("descriptionVi") as string,
      descriptionEn: formData.get("descriptionEn") as string,
      priceMonthly: Number(formData.get("priceMonthly")),
      priceYearly: Number(formData.get("priceYearly")),
      currency: "VND",
      features: finalFeatures,
      limits: {},
      badgeColor: formData.get("badgeColor") as string,
      badgeIcon: formData.get("badgeIcon") as string,
      isPopular: formData.get("isPopular") === "on",
      isActive: formData.get("isActive") === "on",
    };

    startTransition(async () => {
      try {
        const url = isEdit && tier ? `/api/admin/tiers/${tier.id}` : `/api/admin/tiers`;
        const method = isEdit ? "PUT" : "POST";
        
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const m = await res.json();
          throw new Error(m.error || "Có lỗi xảy ra");
        }
        
        router.push("/tiers");
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-[#5a403c]/20 p-8 rounded-2xl shadow-sm space-y-8">
      {errorMsg && (
        <div className="bg-error/20 text-error p-4 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined">warning</span>
          <p>{errorMsg}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-on-surface-variant text-sm font-medium">Slug (VD: standard)</label>
          <input 
            name="slug" 
            required 
            defaultValue={tier?.slug || ""} 
            className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border border-outline/30 focus:border-primary focus:outline-none" 
            placeholder="free"
          />
        </div>

        <div className="space-y-4 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-on-surface-variant text-sm font-medium">Tên (VI)</label>
              <input name="nameVi" required defaultValue={tier?.nameVi || ""} className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border border-outline/30 focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-on-surface-variant text-sm font-medium">Tên (EN)</label>
              <input name="nameEn" required defaultValue={tier?.nameEn || ""} className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border border-outline/30 focus:border-primary focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-on-surface-variant text-sm font-medium">Mô tả (VI)</label>
              <textarea name="descriptionVi" defaultValue={tier?.descriptionVi || ""} rows={2} className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border border-outline/30 focus:border-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-on-surface-variant text-sm font-medium">Mô tả (EN)</label>
              <textarea name="descriptionEn" defaultValue={tier?.descriptionEn || ""} rows={2} className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border border-outline/30 focus:border-primary focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-on-surface-variant text-sm font-medium">Giá Tháng (VND)</label>
          <input type="number" name="priceMonthly" required defaultValue={tier?.priceMonthly?.toString() || "0"} className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border border-outline/30 focus:border-primary focus:outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-on-surface-variant text-sm font-medium">Giá Năm (VND) (Tuỳ chọn)</label>
          <input type="number" name="priceYearly" defaultValue={tier?.priceYearly?.toString() || "0"} className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border border-outline/30 focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div className="border-t border-[#5a403c]/20 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary font-['Noto_Serif']">Tính năng (Features)</h3>
        
        {features.map((feat, index) => (
          <div key={index} className="grid grid-cols-12 gap-3 items-center bg-surface-variant/30 p-4 rounded-xl">
             <div className="col-span-3 lg:col-span-2 space-y-1">
               <label className="text-xs text-on-surface-variant">Key</label>
               <input value={feat.key} onChange={e => handleFeatureChange(index, "key", e.target.value)} placeholder="max_users" className="w-full bg-surface-variant text-on-surface text-sm p-2 rounded-lg border border-outline/30 focus:border-primary focus:outline-none" />
             </div>
             <div className="col-span-4 lg:col-span-3 space-y-1">
               <label className="text-xs text-on-surface-variant">Label (VI)</label>
               <input value={feat.labelVi} onChange={e => handleFeatureChange(index, "labelVi", e.target.value)} placeholder="Tối đa 100 thành viên" className="w-full bg-surface-variant text-on-surface text-sm p-2 rounded-lg border border-outline/30 focus:border-primary focus:outline-none" />
             </div>
             <div className="col-span-4 lg:col-span-3 space-y-1">
               <label className="text-xs text-on-surface-variant">Label (EN)</label>
               <input value={feat.labelEn} onChange={e => handleFeatureChange(index, "labelEn", e.target.value)} placeholder="Max 100 members" className="w-full bg-surface-variant text-on-surface text-sm p-2 rounded-lg border border-outline/30 focus:border-primary focus:outline-none" />
             </div>
             <div className="col-span-12 lg:col-span-3 grid grid-cols-3 gap-2">
                <div className="flex flex-col space-y-1 col-span-1 border-r border-[#5a403c]/20 pr-2 items-center justify-center">
                  <label className="text-xs text-on-surface-variant">Included</label>
                  <input type="checkbox" checked={feat.included} onChange={e => handleFeatureChange(index, "included", e.target.checked)} className="accent-primary w-4 h-4 cursor-pointer" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-on-surface-variant">Limit</label>
                  <input type="number" value={feat.limitStr} onChange={e => handleFeatureChange(index, "limitStr", e.target.value)} placeholder="None" className="w-full bg-surface-variant text-on-surface text-sm p-2 rounded-lg border border-outline/30 focus:border-primary focus:outline-none" />
                </div>
             </div>
             <div className="col-span-12 lg:col-span-1 flex justify-end">
               <button type="button" onClick={() => removeFeature(index)} className="text-error mt-4 p-2 hover:bg-error/10 rounded-full transition-colors flex items-center justify-center"><span className="material-symbols-outlined text-lg">delete</span></button>
             </div>
          </div>
        ))}
        <button type="button" onClick={addFeature} className="bg-surface-variant hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Thêm Tính Năng
        </button>
      </div>

      <div className="border-t border-[#5a403c]/20 pt-6 flex items-center gap-8">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" name="isPopular" defaultChecked={tier?.isPopular} className="w-5 h-5 rounded border-outline/30 text-primary focus:ring-primary focus:ring-offset-background bg-surface-variant" />
          <span className="text-on-surface font-medium group-hover:text-primary transition-colors">Đánh dấu "Phổ Biến"</span>
        </label>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" name="isActive" defaultChecked={tier ? tier.isActive : true} className="w-5 h-5 rounded border-outline/30 text-primary focus:ring-primary focus:ring-offset-background bg-surface-variant" />
          <span className="text-on-surface font-medium group-hover:text-primary transition-colors">Hoạt động (Active)</span>
        </label>
      </div>

      <div className="pt-6 flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-full font-semibold text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-all">
          Hủy
        </button>
        <button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-content px-8 py-2.5 rounded-full font-semibold shadow-[0_0_15px_rgba(233,193,118,0.2)] hover:shadow-[0_0_20px_rgba(233,193,118,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {isPending ? "Đang lưu..." : isEdit ? "Lưu Thay Đổi" : "Tạo Mới"}
        </button>
      </div>
    </form>
  );
}
