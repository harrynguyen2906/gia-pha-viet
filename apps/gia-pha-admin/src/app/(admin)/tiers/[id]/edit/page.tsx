import { TierForm } from "@/components/tiers/TierForm";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Chỉnh Sửa Gói Dịch Vụ | Thiên Phủ Giám",
};

export default async function TierEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const { id } = await params;
  
  const rawTier = await prisma.subscriptionTier.findUnique({
    where: { id },
  });

  if (!rawTier) {
    notFound();
  }

  const tier = JSON.parse(JSON.stringify(rawTier));

  return (
    <div className="flex-1 overflow-y-auto p-8 imperial-scroll space-y-8 pb-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/tiers" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center bg-surface-variant/50 p-2 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-['Noto_Serif'] text-primary mb-1">Chỉnh Sửa: {tier.nameVi}</h1>
            <p className="text-on-surface-variant text-sm">Cập nhật thông tin gói đăng ký.</p>
          </div>
        </div>

        <TierForm tier={tier} isEdit={true} />
      </div>
    </div>
  );
}
