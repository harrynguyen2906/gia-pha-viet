import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserTable } from "@/components/users/UserTable";

export const metadata = {
  title: "Quản Lý Người Dùng | Thiên Phủ Giám",
};

export default async function UsersPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 imperial-scroll space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold font-['Noto_Serif'] text-primary mb-2">Thành Viên (Users)</h1>
          <p className="text-on-surface-variant text-sm">Quản lý và tra cứu tài khoản, dòng họ & gói dịch vụ.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <UserTable />
      </div>
    </div>
  );
}
