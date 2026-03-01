import { Suspense } from "react";
import RitualCalendarClient from "@/components/rituals/RitualCalendarClient";

export const metadata = { title: "Lịch Cúng Kỵ | Heritage Cloud" };

export default function RitualsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">Đang tải lịch…</p>
      </div>
    }>
      <RitualCalendarClient />
    </Suspense>
  );
}
