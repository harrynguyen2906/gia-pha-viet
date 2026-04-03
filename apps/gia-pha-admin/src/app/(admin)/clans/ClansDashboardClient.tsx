"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function ClansDashboardClient({ initialData }: { initialData: any[] }) {
  const [clans] = useState(initialData);

  return (
    <div className="bg-surface-container-low text-secondary imperial-border border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-surface-container imperial-border border-b">
            <tr>
              <th className="px-6 py-3">Tên Gia Tộc</th>
              <th className="px-6 py-3">Ngày Tạo</th>
              <th className="px-6 py-3 text-center">Tài Khoản (Users)</th>
              <th className="px-6 py-3 text-center">Thành Viên (Members)</th>
              <th className="px-6 py-3">Gói Dịch Vụ</th>
            </tr>
          </thead>
          <tbody>
            {clans.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Không có gia tộc nào.
                </td>
              </tr>
            ) : (
              clans.map((clan) => (
                <tr
                  key={clan.id}
                  className="border-b imperial-border hover:bg-surface-container/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-primary hover:underline">
                    <Link href={`/clans/${clan.id}`}>{clan.name}</Link>
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(clan.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </td>
                  <td className="px-6 py-4 text-center">{clan.userCount}</td>
                  <td className="px-6 py-4 text-center">{clan.memberCount}</td>
                  <td className="px-6 py-4">
                    {clan.activeSubscription ? (
                      <span className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-500 border border-green-800">
                        {clan.activeSubscription.tier?.name || "Gói Tương Lai"}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs bg-gray-900/30 text-gray-500 border border-gray-800">
                        Không
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
