"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function PipelineTicker() {
  const [view, setView] = useState("upcoming_30d"); // upcoming_7d, upcoming_30d, past_due, at_risk, recently_renewed
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading } = useSWR(`/api/admin/renewals?view=${view}&page=${page}&pageSize=${pageSize}`, fetcher);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setView("upcoming_7d"); setPage(1); }} className={cn("px-4 py-2 text-sm rounded-full border transition-colors", view === "upcoming_7d" ? "bg-accent/20 border-accent/50 text-accent" : "bg-primary/20 border-border text-blue-muted hover:text-secondary")}>Next 7 Days</button>
        <button onClick={() => { setView("upcoming_30d"); setPage(1); }} className={cn("px-4 py-2 text-sm rounded-full border transition-colors", view === "upcoming_30d" ? "bg-accent/20 border-accent/50 text-accent" : "bg-primary/20 border-border text-blue-muted hover:text-secondary")}>Next 30 Days</button>
        <button onClick={() => { setView("at_risk"); setPage(1); }} className={cn("px-4 py-2 text-sm rounded-full border transition-colors", view === "at_risk" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500" : "bg-primary/20 border-border text-blue-muted hover:text-secondary")}>At Risk (No Auto-Renew)</button>
        <button onClick={() => { setView("past_due"); setPage(1); }} className={cn("px-4 py-2 text-sm rounded-full border transition-colors", view === "past_due" ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-primary/20 border-border text-blue-muted hover:text-secondary")}>Past Due</button>
        <button onClick={() => { setView("recently_renewed"); setPage(1); }} className={cn("px-4 py-2 text-sm rounded-full border transition-colors", view === "recently_renewed" ? "bg-green-500/20 border-green-500/50 text-green-500" : "bg-primary/20 border-border text-blue-muted hover:text-secondary")}>Recently Renewed</button>
      </div>

      <div className="border border-border/50 rounded-lg overflow-hidden bg-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary/20 text-blue-muted">
              <tr>
                <th className="p-4 font-medium">User & Clan</th>
                <th className="p-4 font-medium">Tier & Plan</th>
                <th className="p-4 font-medium">Auto-Renew</th>
                <th className="p-4 font-medium">Status / Expiry</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-secondary">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-muted" /></td></tr>
              ) : (!data?.items || data.items.length === 0) ? (
                <tr><td colSpan={5} className="p-12 text-center text-blue-muted">No subscriptions found for this view.</td></tr>
              ) : (
                data.items.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-primary/10 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{sub.user?.profile?.displayName || "N/A"}</div>
                      <div className="text-xs text-blue-muted">{sub.clan?.name} • {sub.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="font-medium text-accent">{sub.tier?.nameVi}</span>
                      </span>
                      <div className="text-xs text-blue-muted mt-1">
                        {Number(sub.tier?.priceMonthly || 0).toLocaleString()} VND / mo
                      </div>
                    </td>
                    <td className="p-4">
                      {sub.autoRenew ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Enabled</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Disabled</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className={cn("font-medium", new Date(sub.expiresAt) < new Date() ? "text-red-400" : "")}>
                        {format(new Date(sub.expiresAt), "MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-blue-muted">{formatDistanceToNow(new Date(sub.expiresAt), { addSuffix: true })}</div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/users/${sub.userId}`} className="text-accent text-sm hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
