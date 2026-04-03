import { TierForm } from "@/components/tiers/TierForm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tạo Gói Dịch Vụ | Thiên Phủ Giám",
};

export default async function TierCreatePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  return (
    <div className="flex-1 overflow-y-auto p-8 imperial-scroll space-y-8 pb-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/tiers" className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center bg-surface-variant/50 p-2 rounded-full">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-['Noto_Serif'] text-primary mb-1">Tạo Gói Dịch Vụ Mới</h1>
            <p className="text-on-surface-variant text-sm">Thêm một tier mới vào hệ thống Gia Phả số.</p>
          </div>
        </div>

        <TierForm />
      </div>
    </div>
  );
}
