"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import RitualCalendarClient from "./RitualCalendarClient";
import DutyKanbanClient from "../duties/DutyKanbanClient";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DutyStats {
  total: number;
  byStatus: { queue: number; active: number; completed: number; verified: number; cancelled: number };
}

export default function RitualTaskHub() {
  const [activeTab, setActiveTab] = useState<"calendar" | "tasks">("calendar");
  const kanbanMountedRef = useRef(false);
  const [kanbanMounted, setKanbanMounted] = useState(false);

  const { data: statsData } = useSWR<{ data: DutyStats }>("/api/v1/duties/stats", fetcher);
  const pendingCount = statsData?.data?.byStatus?.queue ?? 0;

  // Sync tab from URL hash on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#tasks") {
      setActiveTab("tasks");
      kanbanMountedRef.current = true;
      setKanbanMounted(true);
    } else if (typeof window !== "undefined" && !window.location.hash) {
      window.history.replaceState(null, "", "#calendar");
    }
  }, []);

  const switchTab = (tab: "calendar" | "tasks") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    if (tab === "tasks" && !kanbanMountedRef.current) {
      kanbanMountedRef.current = true;
      setKanbanMounted(true);
    }
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", tab === "calendar" ? "#calendar" : "#tasks");
    }
  };

  const tabs: { key: "calendar" | "tasks"; label: string; icon: string; tooltip: string }[] = [
    {
      key: "calendar",
      label: "Lịch Cúng Kỵ",
      icon: "📅",
      tooltip: "Xem lịch nghi lễ và giỗ tổ theo tháng",
    },
    {
      key: "tasks",
      label: "Quản Lý Bổn Phận",
      icon: "📋",
      tooltip: "Theo dõi và phân công nhiệm vụ gia tộc",
    },
  ];

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* ── Tab Bar ── */}
      <div
        role="tablist"
        aria-label="Điều hướng Nghi Lễ & Bổn Phận"
        className="flex border-b border-antique-gold/20 bg-lacquer-dark/40 shrink-0"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              title={tab.tooltip}
              onClick={() => switchTab(tab.key)}
              className={`
                relative flex items-center gap-2 px-8 py-3 font-header text-sm tracking-widest uppercase
                transition-colors duration-200 min-h-[44px]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imperial-crimson
                focus-visible:ring-offset-1 focus-visible:ring-offset-bg-dark
                ${isActive ? "text-gold-leaf" : "text-antique-gold/50 hover:text-antique-gold/80"}
              `}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.key === "tasks" && pendingCount > 0 && (
                <span className="ml-1 bg-imperial-crimson text-parchment text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
              {/* Active underline indicator */}
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-200 ${
                  isActive ? "bg-imperial-crimson" : "bg-transparent"
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          id="tabpanel-calendar"
          role="tabpanel"
          aria-labelledby="tab-calendar"
          className={`h-full ${activeTab !== "calendar" ? "hidden" : ""}`}
        >
          <RitualCalendarClient />
        </div>
        <div
          id="tabpanel-tasks"
          role="tabpanel"
          aria-labelledby="tab-tasks"
          className={`h-full ${activeTab !== "tasks" ? "hidden" : ""}`}
        >
          {kanbanMounted && <DutyKanbanClient />}
        </div>
      </div>
    </div>
  );
}
