import { Suspense } from "react";
import LineageClient from "@/components/lineage/LineageClient";

export const metadata = { title: "Cây Gia Phả | Heritage Cloud" };

export default function LineagePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">
          Đang khởi tạo gia phả…
        </p>
      </div>
    }>
      <LineageClient />
    </Suspense>
  );
}
