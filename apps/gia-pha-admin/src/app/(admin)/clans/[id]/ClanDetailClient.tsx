"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";

export default function ClanDetailClient({
  initialData,
  clanId,
}: {
  initialData: any;
  clanId: string;
}) {
  const router = useRouter();
  const { clan, memberCount } = initialData;
  const { users, subscriptions } = clan;

  const [activeTab, setActiveTab] = useState("users");
  const activeSub = subscriptions[0];

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/clans/${clanId}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) throw new Error("Thất bại");

      alert("Đã cập nhật trạng thái");
      router.refresh();
    } catch (error) {
      alert("Lỗi cập nhật");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            {clan.name}
          </h2>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-secondary opacity-75 text-sm">
              Ngày tạo: {format(new Date(clan.createdAt), "dd/MM/yyyy", { locale: vi })}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {activeSub ? (
            <span className="px-3 py-1 bg-green-900/40 text-green-400 border border-green-700/50 rounded-full text-sm">
              Gói {activeSub.tier?.name} - Tích Cực
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-900/40 text-gray-400 border border-gray-700/50 rounded-full text-sm">
              Chưa trả phí
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-surface-container-low text-secondary imperial-border border rounded-lg">
          <div className="text-sm font-medium">Thành Viên (Members)</div>
          <div className="text-2xl font-bold mt-2">{memberCount}</div>
        </div>
        <div className="p-6 bg-surface-container-low text-secondary imperial-border border rounded-lg">
          <div className="text-sm font-medium">Tài Khoản (Users)</div>
          <div className="text-2xl font-bold mt-2">{users.length}</div>
        </div>
        <div className="p-6 bg-surface-container-low text-secondary imperial-border border rounded-lg">
          <div className="text-sm font-medium">Băng Thông / Storage</div>
          <div className="text-2xl font-bold mt-2">N/A</div>
        </div>
      </div>

      <div className="imperial-border border-b mb-4 pt-4 flex space-x-4">
        <button
          className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "users" ? "border-primary text-primary" : "border-transparent text-secondary hover:text-primary"
          }`}
          onClick={() => setActiveTab("users")}
        >
          Tài Khoản
        </button>
        <button
          className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "billing" ? "border-primary text-primary" : "border-transparent text-secondary hover:text-primary"
          }`}
          onClick={() => setActiveTab("billing")}
        >
          Gói Dịch Vụ
        </button>
      </div>

      {activeTab === "users" && (
        <div className="bg-surface-container-low text-secondary imperial-border border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-surface-container imperial-border border-b">
              <tr>
                <th className="px-6 py-3">Tên & Email</th>
                <th className="px-6 py-3">Vai Trò</th>
                <th className="px-6 py-3 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b imperial-border">
                  <td className="px-6 py-4">
                    <div className="font-medium text-primary">
                      {u.profile?.displayName || "N/A"}
                    </div>
                    <div className="text-xs opacity-70">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">{u.role}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                      className={`px-3 py-1 rounded text-xs ${
                        u.isActive
                          ? "bg-green-900/30 text-green-500 border border-green-800"
                          : "bg-red-900/30 text-red-500 border border-red-800"
                      }`}
                    >
                      {u.isActive ? "Khoá Kích Hoạt" : "Bỏ Khoá"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="bg-surface-container-low text-secondary imperial-border border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg text-primary">Thông tin Gói Dịch Vụ</h3>
          {activeSub ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="opacity-70">Gói:</span> {activeSub.tier?.name}
              </p>
              <p>
                <span className="opacity-70">Trạng Thái:</span>{" "}
                <span className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-500 border border-green-800">
                  {activeSub.status}
                </span>
              </p>
              <p>
                <span className="opacity-70">Ngày Kích Hoạt:</span>{" "}
                {format(new Date(activeSub.startedAt), "dd/MM/yyyy", { locale: vi })}
              </p>
              <p>
                <span className="opacity-70">Ngày Hết Hạn:</span>{" "}
                {format(new Date(activeSub.expiresAt), "dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
          ) : (
            <p className="text-sm opacity-70">Chưa có gói dịch vụ nào được kích hoạt.</p>
          )}
        </div>
      )}
    </div>
  );
}
