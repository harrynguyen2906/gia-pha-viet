"use client";

import { useState } from "react";
import { Settings, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import GeneralSettings from "@/components/settings/GeneralSettings";
import AdminUsersList from "@/components/settings/AdminUsersList";
import AuditLogTable from "@/components/settings/AuditLogTable";

export default function SettingsDashboardClient() {
  const [activeTab, setActiveTab] = useState<"general" | "admins" | "audit">("general");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-surface-container-low imperial-border p-6 rounded-sm mb-6">
        <div>
          <h1 className="text-3xl font-bold font-['Noto_Serif'] text-primary flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-secondary" />
            Hệ Thống Cấu Hình
          </h1>
          <p className="text-on-surface-variant font-medium">Quản lý và điều chỉnh các thiếp lập chung cho toàn bộ nền tảng Gia Phả.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-outline-variant/30 mb-8 font-medium text-sm font-['Noto_Serif'] relative">
        <button
          onClick={() => setActiveTab("general")}
          className={cn(
            "px-6 py-3 border-b-2 transition-all flex items-center gap-2 rounded-t-sm",
            activeTab === "general" ? "border-secondary text-secondary bg-surface-container-low/80 shadow-[inset_0_-2px_0_rgba(233,193,118,1)]" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40"
          )}
        >
          <Settings className="w-5 h-5" /> Cấu Hình Chung (General)
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={cn(
            "px-6 py-3 border-b-2 transition-all flex items-center gap-2 rounded-t-sm",
            activeTab === "admins" ? "border-secondary text-secondary bg-surface-container-low/80 shadow-[inset_0_-2px_0_rgba(233,193,118,1)]" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40"
          )}
        >
          <Users className="w-5 h-5" /> Quyền Quản Trị (Admins)
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={cn(
            "px-6 py-3 border-b-2 transition-all flex items-center gap-2 rounded-t-sm",
            activeTab === "audit" ? "border-secondary text-secondary bg-surface-container-low/80 shadow-[inset_0_-2px_0_rgba(233,193,118,1)]" : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40"
          )}
        >
          <Activity className="w-5 h-5" /> Ghi Chú Sổ Sách (Audit Logs)
        </button>
      </div>

      <div className="min-h-[500px]">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "admins" && <AdminUsersList />}
        {activeTab === "audit" && <AuditLogTable />}
      </div>
    </div>
  );
}
