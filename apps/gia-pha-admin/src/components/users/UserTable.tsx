"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import Link from "next/link";
import { format } from "date-fns";

export function UserTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const limit = 10;

  const { data, isLoading, mutate } = useUsers(page, limit, search, statusFilter);

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} tài khoản này?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) mutate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface p-4 rounded-2xl border border-[#5a403c]/20 shadow-sm">
        <form onSubmit={handleSearch} className="relative w-full md:w-96 flex">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Tìm theo email, tên, tên dòng họ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-surface-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-l-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-outline/30 focus:border-primary transition-all"
          />
          <button type="submit" className="bg-primary text-primary-content px-4 py-2 rounded-r-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            Tìm
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-surface-variant text-on-surface text-sm border border-outline/30 rounded-xl px-4 py-2 focus:outline-none focus:border-primary cursor-pointer w-full md:w-auto"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-[#5a403c]/20 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-surface-variant/40 border-b border-[#5a403c]/30">
            <tr>
              <th className="p-4 font-medium text-on-surface tracking-wide text-sm">Thành Viên</th>
              <th className="p-4 font-medium text-on-surface tracking-wide text-sm">Dòng Họ (Clan)</th>
              <th className="p-4 font-medium text-on-surface tracking-wide text-sm text-center">Gói Dịch Vụ</th>
              <th className="p-4 font-medium text-on-surface tracking-wide text-sm text-center">Tình Trạng</th>
              <th className="p-4 font-medium text-on-surface tracking-wide text-sm text-center">Đăng nhập</th>
              <th className="p-4 font-medium text-on-surface tracking-wide text-sm text-right">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#5a403c]/10">
            {isLoading && !data?.data ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-on-surface-variant">Đang tải dữ liệu...</td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-on-surface-variant">Không tìm thấy người dùng nào.</td>
              </tr>
            ) : (
              data?.data?.map((user: any) => (
                <tr key={user.id} className="hover:bg-surface-variant/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary font-bold overflow-hidden border border-primary/30">
                        {user.profile?.avatarUrl ? (
                          <img src={user.profile.avatarUrl} alt={user.profile?.displayName || user.email} className="w-full h-full object-cover" />
                        ) : (
                          (user.profile?.displayName || user.email).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-on-surface font-['Noto_Serif'] truncate">{user.profile?.displayName || "Chưa có tên"}</p>
                        <p className="text-xs text-on-surface-variant truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.clan ? (
                      <span className="text-on-surface font-medium bg-surface-variant px-3 py-1 rounded-md text-sm border border-outline/20">
                        {user.clan.name}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant/50 italic text-sm">Chưa có</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {user.currentSubscription?.tier ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${user.currentSubscription.tier.badgeColor || '#4CAF50'}20`, color: user.currentSubscription.tier.badgeColor || '#4CAF50', border: `1px solid ${user.currentSubscription.tier.badgeColor || '#4CAF50'}40` }}>
                        {user.currentSubscription.tier.badgeIcon && <span className="material-symbols-outlined text-[14px]">{user.currentSubscription.tier.badgeIcon}</span>}
                        {user.currentSubscription.tier.nameVi}
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full bg-surface-variant/50 text-on-surface-variant text-xs font-medium border border-outline/20">
                        Miễn Phí
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleStatus(user.id, user.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                        user.isActive
                          ? "bg-secondary/10 text-[#4CAF50] border border-[#4CAF50]/30 hover:bg-[#4CAF50]/20"
                          : "bg-error/10 text-error border border-error/30 hover:bg-error/20"
                      }`}
                      title={user.isActive ? "Nhấn để khóa" : "Nhấn để mở khóa"}
                    >
                      {user.isActive ? "Hoạt Động" : "Đã Khóa"}
                    </button>
                  </td>
                  <td className="p-4 text-center text-sm text-on-surface-variant">
                    {user.lastLoginAt ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm") : "-"}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/users/${user.id}`}
                      className="p-2 text-on-surface-variant hover:text-primary transition-colors inline-block bg-surface-variant rounded-full shadow-sm hover:shadow-md"
                      title="Xem Chi Tiết"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#5a403c]/20 flex items-center justify-between bg-surface-variant/20">
            <span className="text-sm text-on-surface-variant">
              Hiển thị <span className="font-medium text-on-surface">{(page - 1) * limit + 1}</span> đến <span className="font-medium text-on-surface">{Math.min(page * limit, data.meta.total)}</span> trong <span className="font-medium text-on-surface">{data.meta.total}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface hover:bg-surface-variant border border-outline/30 text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="text-sm font-medium px-2">{page} / {data.meta.totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} 
                disabled={page === data.meta.totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface hover:bg-surface-variant border border-outline/30 text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
