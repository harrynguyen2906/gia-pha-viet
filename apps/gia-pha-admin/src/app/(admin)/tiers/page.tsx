import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TierTable } from "@/components/tiers/TierTable";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Quản Lý Gói Dịch Vụ | Thiên Phủ Giám",
};

export default async function TiersPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  }

  const rawTiers = await prisma.subscriptionTier.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const initialTiers = JSON.parse(JSON.stringify(rawTiers));

  return (
    <div className="flex-1 overflow-y-auto p-8 imperial-scroll space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold font-['Noto_Serif'] text-primary mb-2">Các Gói Dịch Vụ</h1>
          <p className="text-on-surface-variant text-sm">Quản lý các gói đăng ký Gia Phả số (Tiers).</p>
        </div>
        
        <Link
          href="/tiers/create"
          className="bg-primary hover:bg-primary/90 text-primary-content hover:shadow-[0_0_15px_rgba(233,193,118,0.4)] transition-all px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tạo Gói Mới
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <TierTable initialTiers={initialTiers} />
      </div>
    </div>
  );
}
