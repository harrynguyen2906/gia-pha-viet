"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function GeneralSettings() {
  const { data, isLoading } = useSWR("/api/admin/settings", fetcher);
  
  const [formData, setFormData] = useState({
    platformName: "",
    defaultCurrency: "VND",
    gracePeriodDays: 0,
    trialPeriodDays: 0
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (data && !data.error) {
      setFormData({
        platformName: data.platformName || "",
        defaultCurrency: data.defaultCurrency || "VND",
        gracePeriodDays: data.gracePeriodDays || 0,
        trialPeriodDays: data.trialPeriodDays || 0
      });
    }
  }, [data]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-secondary flex gap-3 items-center p-8 bg-surface-container-low imperial-border rounded-sm"><Loader2 className="animate-spin w-6 h-6"/> Đang tải dữ liệu...</div>;
  if (data?.error) return <div className="text-error bg-error-container/20 p-6 imperial-border rounded-sm">Không thể tải thông tin hệ thống.</div>;

  return (
    <div className="max-w-3xl bg-surface-container-low border border-outline-variant/30 rounded-sm p-6 lg:p-10 imperial-border shadow-2xl">
      <h2 className="text-3xl font-bold font-['Noto_Serif'] text-secondary mb-8 border-b border-outline-variant/30 pb-4">Nền Tảng Hệ Thống</h2>
      
      <form onSubmit={handleSave} className="space-y-8">
        <div className="space-y-3">
          <label className="text-base font-semibold text-on-surface-variant block">Ngự Xưng (Platform Name)</label>
          <input 
            type="text" 
            className="w-full p-4 bg-surface border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none font-medium shadow-inner"
            value={formData.platformName}
            onChange={(e) => setFormData({...formData, platformName: e.target.value})}
            required
          />
        </div>

        <div className="space-y-3">
          <label className="text-base font-semibold text-on-surface-variant block">Ngân Lượng Trọng Yếu (Default Currency)</label>
          <select 
            className="w-full p-4 bg-surface border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none font-medium shadow-inner"
            value={formData.defaultCurrency}
            onChange={(e) => setFormData({...formData, defaultCurrency: e.target.value})}
          >
            <option value="VND">VND - Đồng Việt Nam</option>
            <option value="USD">USD - Đô la Mỹ</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-base font-semibold text-on-surface-variant block">Gia Hạn Châm Chước (Grace Period)</label>
            <div className="relative">
              <input 
                type="number" 
                min="0"
                className="w-full p-4 pr-16 bg-surface border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none font-medium shadow-inner text-right"
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({...formData, gracePeriodDays: parseInt(e.target.value) || 0})}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">Ngày</span>
            </div>
            <p className="text-sm text-on-surface-variant/80 font-medium mt-2 italic">Số ngày được phép duy trì dữ liệu mờ trước khi tước quyền.</p>
          </div>
          
          <div className="space-y-3">
            <label className="text-base font-semibold text-on-surface-variant block">Kỳ Dùng Đạm (Trial Period)</label>
            <div className="relative">
              <input 
                type="number" 
                min="0"
                className="w-full p-4 pr-16 bg-surface border-b-2 border-outline-variant focus:border-secondary text-secondary transition-colors outline-none font-medium shadow-inner text-right"
                value={formData.trialPeriodDays}
                onChange={(e) => setFormData({...formData, trialPeriodDays: parseInt(e.target.value) || 0})}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium">Ngày</span>
            </div>
            <p className="text-sm text-on-surface-variant/80 font-medium mt-2 italic">Số ngày dung túng trải nghiệm cho gia tộc mới đăng ký.</p>
          </div>
        </div>

        <div className="pt-8 flex items-center gap-5 border-t border-outline-variant/30 mt-10">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(233,193,118,0.5)] px-8 py-3.5 rounded-full transition-all disabled:opacity-50 flex items-center gap-3 border border-secondary/30 imperial-border group"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin text-secondary" /> : <Save className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />}
            <span className="text-secondary font-bold text-lg">Khắc Lưu Sổ Sách (Save)</span>
          </button>
          {message && (
            <span className={cn("text-base font-bold px-4 py-2 rounded-sm imperial-border", message.includes("success") ? "text-secondary bg-secondary-container/20" : "text-error bg-error-container/20")}>
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
