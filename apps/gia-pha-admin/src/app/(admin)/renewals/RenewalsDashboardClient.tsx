"use client";

import { useState } from "react";
import useSWR from "swr";
import { Loader2, Calendar, AlertTriangle, Clock, RefreshCw, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import PipelineTicker from "@/components/renewals/PipelineTicker";
import CalendarView from "@/components/renewals/CalendarView";
import CancellationQueue from "@/components/renewals/CancellationQueue";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RenewalsDashboardClient() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "calendar" | "cancellations">("pipeline");

  const { data: summary, isLoading } = useSWR("/api/admin/renewals/summary", fetcher, { refreshInterval: 60000 });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-['Noto_Serif'] text-primary mb-2 flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-secondary" /> 
            Gia Hạn & Hủy Gói
          </h1>
          <p className="text-on-surface-variant text-sm">Quản lý vòng đời gói đăng ký, theo dõi và xử lý yêu cầu hủy gia hạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-sm bg-surface-container-low imperial-border group">
          <div className="text-sm text-on-surface-variant flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-secondary" /> Trong 7 Ngày Tới
          </div>
          <div className="text-4xl font-bold text-secondary font-display">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-secondary" /> : summary?.upcoming7d || 0}
          </div>
        </div>

        <div className="p-6 rounded-sm bg-surface-container-low imperial-border group">
          <div className="text-sm text-on-surface-variant flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-secondary" /> Trong 30 Ngày Tới
          </div>
          <div className="text-4xl font-bold text-secondary font-display">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-secondary" /> : summary?.upcoming30d || 0}
          </div>
        </div>

        <div className="p-6 rounded-sm bg-surface-container-highest lacquer-plaque relative overflow-hidden group">
          <div className="text-sm text-primary-fixed-dim font-bold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> Quá Hạn
          </div>
          <div className="text-4xl font-bold text-secondary font-display">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary-fixed-dim" /> : summary?.pastDue || 0}
          </div>
        </div>

        <div className="p-6 rounded-sm bg-surface-container-high imperial-border group">
          <div className="text-sm text-secondary font-bold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> Khách Hàng Rủi Ro
          </div>
          <div className="text-4xl font-bold text-secondary font-display">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-secondary" /> : summary?.atRisk || 0}
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-outline-variant/30 mb-8 font-medium text-sm font-['Noto_Serif'] relative">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={cn(
            "px-6 py-3 border-b-2 transition-all",
            activeTab === "pipeline" ? "border-secondary text-secondary bg-surface-container-low/50" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/30"
          )}
        >
          Pipeline Gia Hạn
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={cn(
            "px-6 py-3 border-b-2 transition-all",
            activeTab === "calendar" ? "border-secondary text-secondary bg-surface-container-low/50" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/30"
          )}
        >
          Lịch Trình
        </button>
        <button
          onClick={() => setActiveTab("cancellations")}
          className={cn(
            "px-6 py-3 border-b-2 transition-all flex items-center gap-2",
            activeTab === "cancellations" ? "border-secondary text-secondary bg-surface-container-low/50" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/30"
          )}
        >
          Hàng Đợi Hủy Gói
        </button>
      </div>

      <div className="min-h-[500px] bg-surface rounded-sm">
        {activeTab === "pipeline" && <PipelineTicker />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "cancellations" && <CancellationQueue />}
      </div>
    </div>
  );
}
