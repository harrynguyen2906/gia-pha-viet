"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DutiesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/rituals#tasks");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">Đang chuyển hướng…</p>
    </div>
  );
}
