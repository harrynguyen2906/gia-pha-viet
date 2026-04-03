"use client";

import { useState } from "react";
import useSWR from "swr";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import CancellationDetailModal from "./CancellationDetailModal";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CancellationQueue() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data, isLoading, mutate } = useSWR(`/api/admin/cancellations?page=${page}&pageSize=${pageSize}`, fetcher);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-secondary">
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-red-500/20 rounded-full">
            <UserMinus className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-red-400">Action Required</h3>
            <p className="text-sm text-blue-muted">Review these pending cancellation requests. Try to offer retention discounts before approving.</p>
          </div>
        </div>
        <div className="text-4xl font-bold text-red-400">
          {data?.totalCount || 0}
        </div>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary/20 text-blue-muted">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Requested At</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-secondary">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-muted" /></td></tr>
              ) : (!data?.items || data.items.length === 0) ? (
                <tr><td colSpan={5} className="p-12 text-center text-blue-muted">No pending cancellation requests. Good job!</td></tr>
              ) : (
                data.items.map((req: any) => (
                  <tr key={req.id} className="hover:bg-primary/10 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{req.subscription?.user?.profile?.displayName || "N/A"}</div>
                      <div className="text-xs text-blue-muted">{req.subscription?.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-500 border border-red-500/20">{req.cancellationReason}</span>
                      {req.cancellationFeedback && <div className="text-xs text-blue-muted mt-1 truncate max-w-[200px]">{req.cancellationFeedback}</div>}
                    </td>
                    <td className="p-4">
                      {req.cancellationType === "IMMEDIATE" ? (
                        <span className="text-red-400 font-medium">Immediate</span>
                      ) : (
                        <span className="text-yellow-400">End of Period</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>{format(new Date(req.createdAt), "MMM d, yyyy")}</div>
                      <div className="text-xs text-blue-muted">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <CancellationDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onProcessed={() => {
            setSelectedRequest(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}
