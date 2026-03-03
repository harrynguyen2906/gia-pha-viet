import { Suspense } from "react";
import RitualTaskHub from "@/components/rituals/RitualTaskHub";

export const metadata = { title: "Nghi Lễ & Bổn Phận | Heritage Cloud" };

export default function RitualsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">Đang tải…</p>
      </div>
    }>
      <RitualTaskHub />
    </Suspense>
  );
}
