"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Search, Loader2, Download, FileText } from "lucide-react";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function OrderTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const pageSize = 10;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search: debouncedSearch,
    status: statusFilter,
  });

  const { data, error, isLoading } = useSWR(`/api/admin/orders?${queryParams.toString()}`, fetcher, {
    keepPreviousData: true,
  });

  const handleExport = () => {
    window.location.href = "/api/admin/orders/export";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl text-secondary flex items-center gap-2">
          <FileText className="w-8 h-8" /> Orders Management
        </h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-md hover:bg-secondary/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-border w-5 h-5" />
          <input
            type="text"
            placeholder="Search orders by number or user email..."
            className="w-full pl-10 pr-4 py-2 bg-primary/20 border border-border rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-border"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-primary/20 border border-border rounded-lg text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary/20 text-blue-muted">
              <tr>
                <th className="p-4 font-medium">Order Number</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Tier & Clan</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-secondary">
              {isLoading && !data ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-blue-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    Loading orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-red-500">
                    Failed to load orders.
                  </td>
                </tr>
              ) : data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-blue-muted">
                    No orders found.
                  </td>
                </tr>
              ) : (
                data?.items?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-primary/10 transition-colors">
                    <td className="p-4">
                      <Link href={`/orders/${order.id}`} className="font-mono text-accent hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{order.user?.profile?.displayName || "User"}</div>
                      <div className="text-xs text-blue-muted">{order.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <div>{order.tier?.nameVi}</div>
                      <div className="text-xs text-blue-muted">{order.clan?.name}</div>
                    </td>
                    <td className="p-4 font-medium">{Number(order.amount).toLocaleString()} VND</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full border",
                        order.status === "COMPLETED" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        order.status === "PENDING" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                        order.status === "REFUNDED" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-blue-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-border/30 bg-primary/10 flex items-center justify-between text-sm">
            <div className="text-blue-muted">
              Showing page {data.page} of {data.totalPages} ({data.totalCount} orders)
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-primary/30 border border-border rounded disabled:opacity-50 text-secondary hover:bg-primary/50"
              >
                Previous
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-primary/30 border border-border rounded disabled:opacity-50 text-secondary hover:bg-primary/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
