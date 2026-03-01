import { Suspense } from "react";
import DutyKanbanClient from "@/components/duties/DutyKanbanClient";

export const metadata = { title: "Phân Công Việc | Heritage Cloud" };

export default function DutiesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">Đang tải nhiệm vụ…</p>
      </div>
    }>
      <DutyKanbanClient />
    </Suspense>
  );
}
