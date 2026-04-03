import { Suspense } from "react";
import MapClient from "@/components/map/MapClient";

export const metadata = { title: "Bản Đồ Mộ Phần | Heritage Cloud" };

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">
          Đang tải bản đồ…
        </p>
      </div>
    }>
      <MapClient />
    </Suspense>
  );
}
