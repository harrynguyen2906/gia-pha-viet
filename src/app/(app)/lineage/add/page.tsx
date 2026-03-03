"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AddMemberForm from "@/components/lineage/AddMemberForm";

function AddMemberPageContent() {
  const searchParams = useSearchParams();
  const defaultParentId = searchParams.get("parentId") ?? "";

  return <AddMemberForm defaultParentId={defaultParentId} mode="page" />;
}

export default function AddMemberPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="font-header text-antique-gold/60 text-sm tracking-widest animate-pulse">
            Dang tai...
          </p>
        </div>
      }
    >
      <AddMemberPageContent />
    </Suspense>
  );
}
